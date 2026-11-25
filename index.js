/**
 * Host half of the token-heatmap bundle.
 *
 * It answers one question for the browser: how many tokens did every model
 * burn on every day? The answer is folded from the session corpus the Host
 * already keeps: each session's durable log carries the provider usage of
 * every assistant message and the route (provider and model) that produced
 * it, so the daily and per-model totals survive restarts and cover history
 * that predates this plugin.
 *
 * Folding the corpus is the slow part, so it never happens on the request
 * path. The fold runs in the background, its per-session result is kept in a
 * ledger file next to the other profile state, and the route answers from
 * that ledger in milliseconds.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { probePlans, configuredRoutes, routeSignature } from './plans.js'

/** Cordis function-plugin name. */
export const name = 'token-heatmap'

/** The route carrier, the trust fence guarding it, and the session corpus. */
export const inject = ['webServer', 'connection', 'sessionQuery']

/** The route the browser reads. */
const USAGE_PATH = '/token-heatmap/usage'

/** How often the background refresh looks for new usage. */
const REFRESH_INTERVAL_MS = 20_000

/** How often the background refresh re-reads the whole corpus. */
const FULL_REFRESH_INTERVAL_MS = 10 * 60_000

/** How old a plan row may be before the providers are asked again. */
const PLAN_STALE_MS = 30_000

/**
 * The folder the ledger lives in.
 *
 * @returns {string} the ledger folder.
 */
function ledgerFolder() {
  const profile = process.env.DSH_PROFILE_DIR
  if (typeof profile === 'string' && profile.length > 0) return join(profile, 'dsh-token-heatmap')
  return join(homedir(), '.dsh', 'dsh-token-heatmap')
}

/**
 * Format an epoch timestamp as the local calendar day it belongs to.
 *
 * @param {number} time - Unix epoch milliseconds.
 * @returns {string} the `YYYY-MM-DD` day.
 */
function dayOf(time) {
  const date = new Date(time)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * The route that produced one assistant message.
 *
 * The message itself names its provider and model; the last `request/header`
 * event is the fallback for messages that do not.
 *
 * @param {object} event - the session event.
 * @param {{ provider: string, model: string } | null} lastHeader - the last seen route.
 * @returns {{ provider: string, model: string } | null} the route.
 */
function routeOf(event, lastHeader) {
  const source = event.data?.message?.source
  if (source !== undefined && typeof source.provider === 'string' && typeof source.model === 'string') {
    return { provider: source.provider, model: source.model }
  }
  return lastHeader
}

/**
 * Fold one session's events into the per-day, per-model buckets.
 *
 * @param {object} snapshot - the session log snapshot.
 * @returns {object} the session's day buckets.
 */
function foldSession(snapshot) {
  const days = {}
  const inherited = snapshot.inheritedEventCount ?? 0
  const events = snapshot.events ?? []
  let lastHeader = null
  for (const event of events.slice(inherited)) {
    if (event.type === 'request/header') {
      const config = event.data?.header?.config
      if (config !== undefined && typeof config.provider === 'string' && typeof config.model === 'string') {
        lastHeader = { provider: config.provider, model: config.model }
      }
      continue
    }
    if (event.type !== 'assistant/message') continue
    const usage = event.data?.usage
    if (usage === undefined) continue
    const route = routeOf(event, lastHeader)
    if (route === null) continue
    const day = dayOf(event.time)
    const key = `${route.provider}/${route.model}`
    const bucket = (days[day] ??= {})
    const cell = (bucket[key] ??= { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 })
    cell.input += usage.inputTokens ?? 0
    cell.output += usage.outputTokens ?? 0
    cell.cacheRead += usage.cacheReadTokens ?? 0
    cell.cacheWrite += usage.cacheWriteTokens ?? 0
    cell.calls += 1
  }
  return days
}

/**
 * Merge the per-session buckets into the whole-corpus day buckets.
 *
 * @param {object} sessions - the per-session buckets of the ledger.
 * @returns {object} the day buckets.
 */
function mergeDays(sessions) {
  const days = {}
  for (const sessionDays of Object.values(sessions)) {
    for (const [day, models] of Object.entries(sessionDays)) {
      const bucket = (days[day] ??= {})
      for (const [key, cell] of Object.entries(models)) {
        const target = (bucket[key] ??= { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 })
        target.input += cell.input
        target.output += cell.output
        target.cacheRead += cell.cacheRead
        target.cacheWrite += cell.cacheWrite
        target.calls += cell.calls
      }
    }
  }
  return days
}

/**
 * The browser's answer: the folded days and the plan rows, oldest first.
 *
 * @param {object} ledger - the ledger state.
 * @returns {object} the payload.
 */
function payload(ledger) {
  const days = mergeDays(ledger.sessions)
  const rows = Object.entries(days)
    .map(([day, models]) => ({ day, models }))
    .sort((left, right) => (left.day < right.day ? -1 : left.day > right.day ? 1 : 0))
  return {
    updatedAt: ledger.updatedAt,
    refreshing: ledger.folding !== null,
    plans: ledger.plans,
    plansAt: ledger.plansAt,
    plansReady: ledger.plansReady,
    days: rows,
  }
}

/**
 * Read the ledger file into the ledger state.
 *
 * The file holds the plan rows of the last probe as well, so a start shows
 * the plans right away instead of waiting for the providers to answer again.
 *
 * @param {object} ledger - the ledger state.
 * @param {string} path - the ledger file.
 * @returns {Promise<void>} after the ledger holds what the file held.
 */
async function loadLedger(ledger, path) {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8'))
    if (parsed?.version === 1 && parsed.sessions !== undefined) {
      ledger.sessions = parsed.sessions
      ledger.updatedAt = parsed.updatedAt ?? 0
      ledger.plans = Array.isArray(parsed.plans) ? parsed.plans : []
      ledger.plansAt = Number(parsed.plansAt ?? 0)
      // A ledger that holds plan rows was written by a Host that already
      // looked, so the browser need not wait for the next probe.
      ledger.plansReady = Array.isArray(parsed.plans)
    }
  } catch {
    // A missing or unreadable ledger simply means "fold everything once".
  }
}

/**
 * Write the ledger state back to its file.
 *
 * @param {object} ledger - the ledger state.
 * @param {string} path - the ledger file.
 * @returns {Promise<void>} after the write settled.
 */
async function saveLedger(ledger, path) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify({
    version: 1,
    updatedAt: ledger.updatedAt,
    plans: ledger.plans,
    plansAt: ledger.plansAt,
    sessions: ledger.sessions,
  }))
}

/**
 * Fold one session and keep its buckets in the ledger.
 *
 * @param {object} ledger - the ledger state.
 * @param {object} sessionQuery - the Host's session query service.
 * @param {string} sessionId - the session to fold.
 * @returns {Promise<void>} after the ledger holds the session's buckets.
 */
async function foldInto(ledger, sessionQuery, sessionId) {
  try {
    const snapshot = await sessionQuery.readSession(sessionId)
    ledger.sessions[sessionId] = foldSession(snapshot)
  } catch {
    // A corrupt or unreadable log is skipped; the rest of the corpus answers.
  }
}

/**
 * Refresh the ledger from the corpus.
 *
 * A quick refresh only re-reads the live sessions and the ones the ledger has
 * never seen; a full refresh re-reads everything, which is how a cold log
 * that changed outside this process is picked up.
 *
 * @param {object} ledger - the ledger state.
 * @param {object} sessionQuery - the Host's session query service.
 * @param {object} options - the refresh options.
 * @param {boolean} options.full - whether every session is re-read.
 * @returns {Promise<void>} after the ledger and its file hold the new totals.
 */
async function refreshLedger(ledger, sessionQuery, { full }) {
  const records = await sessionQuery.listSessions()
  const targets = records
    .filter(record => full || record.live || ledger.sessions[record.header.id] === undefined)
    .map(record => record.header.id)
  for (const sessionId of targets) {
    await foldInto(ledger, sessionQuery, sessionId)
  }
  if (targets.length > 0) {
    ledger.updatedAt = Date.now()
    await saveLedger(ledger, ledger.path)
  }
}

/**
 * The usage refresher of the Host.
 *
 * One fold runs at a time: a read that arrives during a fold waits for it
 * instead of starting a second one.
 *
 * @param {object} ctx - the Host plugin context.
 * @param {object} ledger - the ledger state.
 * @returns {object} the refresher.
 */
function createUsageRefresher(ctx, ledger) {
  /**
   * Fold the corpus once, unless a fold is already running.
   *
   * @param {boolean} full - whether every session is re-read.
   * @returns {Promise<void>} after the fold settled.
   */
  const refresh = async (full) => {
    if (ledger.folding !== null) return ledger.folding
    ledger.folding = (async () => {
      try {
        await refreshLedger(ledger, ctx.sessionQuery, { full })
      } catch {
        // A failed refresh keeps the previous totals; the next tick retries.
      } finally {
        ledger.folding = null
      }
    })()
    return ledger.folding
  }

  return { refresh }
}

/**
 * The plan probe of the Host.
 *
 * One probe runs at a time. The rows it produced keep their own time stamp,
 * so the browser can tell fresh rows from the ones a start restored from the
 * ledger.
 *
 * @param {object} ctx - the Host plugin context.
 * @param {object} ledger - the ledger state.
 * @returns {object} the probe.
 */
function createPlanProbe(ctx, ledger) {
  let inFlight = null
  let lastAttempt = 0
  let signature = ''

  /**
   * Ask the providers once and keep the rows that answer.
   *
   * A route that stopped answering keeps its last known row, but the row is
   * marked as the last known one so the browser can say so.
   *
   * @returns {Promise<void>} after the plan rows settled.
   */
  const run = async () => {
    try {
      const answer = await probePlans(ctx)
      // A provider that did not answer keeps its last known row.
      const merged = new Map(ledger.plans.map(plan => [plan.id, plan]))
      for (const row of answer.plans) merged.set(row.id, { ...row, stale: false })
      for (const routeId of answer.failed) {
        const known = merged.get(`plan-${routeId}`)
        if (known !== undefined) merged.set(known.id, { ...known, stale: true })
      }
      ledger.plans = [...merged.values()]
      ledger.plansAt = Date.now()
      await saveLedger(ledger, ledger.path)
    } catch {
      // A failed probe keeps the previous rows; the next tick retries.
    }
    // The Host looked, so the browser knows that no row means "no plan".
    ledger.plansReady = true
  }

  /**
   * Ask the providers when the known rows are older than the given age.
   *
   * A route that was added to the profile makes the rows out of date right
   * away, so a new plan shows up on the next read instead of on the next
   * full tick.
   *
   * @param {number} maxAgeMs - how old a row may be.
   * @param {boolean} force - whether to ask even when the rows are fresh.
   * @returns {Promise<void>} after the probe settled, or right away.
   */
  const ensureFresh = async (maxAgeMs, force = false) => {
    const current = routeSignature(configuredRoutes(ctx))
    const changed = current !== signature
    if (!force && !changed) {
      const known = Math.max(ledger.plansAt, lastAttempt)
      if (Date.now() - known < maxAgeMs) return
    }
    if (inFlight !== null) return inFlight
    lastAttempt = Date.now()
    signature = current
    inFlight = run().finally(() => { inFlight = null })
    return inFlight
  }

  return { ensureFresh }
}

/**
 * Register the route the browser reads.
 *
 * @param {object} ctx - the Host plugin context.
 * @param {object} ledger - the ledger state.
 * @param {object} refresher - the usage refresher.
 * @param {object} probe - the plan probe.
 * @returns {object} the route effect.
 */
function registerUsageRoute(ctx, ledger, refresher, probe) {
  return ctx.webServer.register({
    kind: 'exact',
    path: USAGE_PATH,
    handler: async (req, res) => {
      const rejection = ctx.connection.requestRejection(req)
      if (rejection !== undefined) {
        res.statusCode = rejection
        res.end()
        return
      }
      if (req.method !== 'GET') {
        res.statusCode = 405
        res.setHeader('allow', 'GET')
        res.end()
        return
      }
      const body = payload(ledger)
      res.statusCode = 200
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.setHeader('cache-control', 'no-store')
      res.end(JSON.stringify(body))
      // The answer is already on its way; the next refresh only updates it.
      const fresh = typeof req.url === 'string' && req.url.includes('fresh=1')
      if (fresh) {
        void refresher.refresh(false)
        // A plan that was added to the profile shows up at once.
        void probe.ensureFresh(PLAN_STALE_MS, true)
      }
      // Stale rows are refreshed in the background, so the next read is fresh.
      void probe.ensureFresh(PLAN_STALE_MS)
    },
  }, `token-heatmap: GET ${USAGE_PATH}`)
}

/**
 * Run the background refresh of the usage and of the plans.
 *
 * @param {object} refresher - the usage refresher.
 * @param {object} probe - the plan probe.
 * @returns {function} the stop function of the timer.
 */
function startBackgroundRefresh(refresher, probe) {
  let ticks = 0
  let planTicks = 0
  const timer = setInterval(() => {
    ticks += 1
    planTicks += 1
    const full = ticks * REFRESH_INTERVAL_MS >= FULL_REFRESH_INTERVAL_MS
    if (full) ticks = 0
    void refresher.refresh(full)
    if (planTicks % 2 === 0) {
      planTicks = 0
      void probe.ensureFresh(PLAN_STALE_MS)
    }
  }, REFRESH_INTERVAL_MS)
  return () => clearInterval(timer)
}

/**
 * Register the usage route and the background refresh.
 *
 * @param {object} ctx - the Host plugin context.
 */
export function apply(ctx) {
  const ledger = {
    sessions: {},
    updatedAt: 0,
    folding: null,
    plans: [],
    plansAt: 0,
    plansReady: false,
    path: join(ledgerFolder(), 'ledger.json'),
  }
  const refresher = createUsageRefresher(ctx, ledger)
  const probe = createPlanProbe(ctx, ledger)

  ctx.effect(
    () => registerUsageRoute(ctx, ledger, refresher, probe),
    `token-heatmap: GET ${USAGE_PATH}`,
  )

  ctx.effect(() => {
    void (async () => {
      await loadLedger(ledger, ledger.path)
      // The fold and the plan probe do not depend on each other: both start now.
      await Promise.all([refresher.refresh(true), probe.ensureFresh(0)])
    })()
    return startBackgroundRefresh(refresher, probe)
  }, 'token-heatmap: background refresh')
}

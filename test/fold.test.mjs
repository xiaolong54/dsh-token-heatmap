/**
 * Host-half check: the usage route folds a fake session corpus into the
 * per-day, per-model buckets the page expects, and a cold start answers with
 * the plan rows of the last probe before the providers reply again.
 *
 * Usage: node test/fold.test.mjs
 */

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply } from '../index.js'

/** The answer of a MiniMax coding plan. */
const MINIMAX_ANSWER = {
  base_resp: { status_code: 0 },
  model_remains: [{
    model_name: 'general',
    current_interval_remaining_percent: 50,
    end_time: 1900000000,
    current_weekly_status: 1,
    current_weekly_remaining_percent: 80,
    weekly_end_time: 1900000000,
  }],
}

/** One fake session with two assistant messages on two days. */
const events = [
  { type: 'request/header', time: Date.parse('2026-11-23T09:00:00+08:00'), data: { header: { config: { provider: 'mini', model: 'MiniMax-M3.1-Flash' } } } },
  { type: 'assistant/message', time: Date.parse('2026-11-23T09:00:05+08:00'), data: { usage: { inputTokens: 100, outputTokens: 20, cacheReadTokens: 900, cacheWriteTokens: 0 }, message: { source: { kind: 'model', provider: 'mini', model: 'MiniMax-M3.1-Flash' } } } },
  { type: 'assistant/message', time: Date.parse('2026-11-24T10:00:05+08:00'), data: { usage: { inputTokens: 5, outputTokens: 1 }, message: { source: { kind: 'model', provider: 'mini', model: 'MiniMax-M3.1-Flash' } } } },
  { type: 'assistant/message', time: Date.parse('2026-11-24T11:00:05+08:00'), data: { usage: { inputTokens: 7, outputTokens: 3 }, message: { source: { kind: 'model', provider: 'deepseek', model: 'deepseek-chat' } } } },
  { type: 'assistant/message', time: Date.parse('2026-11-24T12:00:05+08:00'), data: { message: { source: { kind: 'model', provider: 'mini', model: 'MiniMax-M3.1-Flash' } } } },
]

/** The fake corpus: one readable session and one broken one. */
const sessionQuery = {
  async listSessions() {
    return [{ header: { id: 'a' } }, { header: { id: 'broken' } }]
  },
  async readSession(id) {
    if (id === 'broken') throw new Error('corrupt log')
    return { inheritedEventCount: 0, events }
  },
}

/** A minimal response double. */
const response = {
  statusCode: 0,
  headers: {},
  body: '',
  setHeader(name, value) { this.headers[name] = value },
  end(text) { this.body = text ?? '' },
}

/** Read the route and return the payload the browser would get. */
async function readRoute(handler) {
  await handler({ method: 'GET', url: '/token-heatmap/usage' }, response)
  assert.equal(response.statusCode, 200)
  return JSON.parse(response.body)
}

/** The services the plugin reads, with one configured MiniMax route. */
function fakeServices(capture) {
  return {
    sessionQuery,
    connection: { requestRejection: () => undefined },
    webServer: { register: route => { capture(route) } },
    effect: fn => fn(),
    get: name => {
      if (name === 'configEditor') {
        return {
          configuration: () => [{
            entry: { options: { id: 'llm-pi-ai' } },
            inherited: { providers: { minimax: { baseURL: 'https://api.minimax.io/v1', apiKeyEnv: 'MINIMAX_KEY' } } },
          }],
        }
      }
      if (name === 'credentials') {
        return {
          readRecord: async () => ({ kind: 'api-key', key: 'test-key' }),
          resolve: async () => ({ value: 'test-key' }),
        }
      }
      return undefined
    },
  }
}

/** Wait for the background work of the Host to land. */
const settle = () => new Promise(resolve => setTimeout(resolve, 50))

// --- A machine that ran the plugin before: the ledger holds the plan rows ---

const profile = mkdtempSync(join(tmpdir(), 'dsh-token-heatmap-'))
process.env.DSH_PROFILE_DIR = profile

const storedPlan = {
  id: 'plan-mini',
  provider: 'mini',
  label: 'MiniMax 套餐 · mini',
  windows: [{ key: 'interval', name: '5 小时窗口', used: 40, remaining: 60, resetsAt: 1900000000000 }],
}
mkdirSync(join(profile, 'dsh-token-heatmap'), { recursive: true })
writeFileSync(join(profile, 'dsh-token-heatmap', 'ledger.json'), JSON.stringify({
  version: 1,
  updatedAt: 1795496706688,
  plans: [storedPlan],
  plansAt: 1795496706688,
  sessions: {},
}))

// The provider probe is slow on a start: hold the answer back so the test
// can look at the state the browser sees before the providers reply.
let pending = []
globalThis.fetch = () => new Promise((resolve) => { pending.push(resolve) })

/** Answer every request that is waiting. */
function answerAll(response) {
  const waiting = pending
  pending = []
  for (const resolve of waiting) resolve(response)
}

/** Answer every request that waits, over as many rounds as the vendor needs. */
async function answerAllRounds(response) {
  for (let round = 0; round < 16; round += 1) {
    await settle()
    if (pending.length === 0) return
    answerAll(response)
  }
}

let handler
apply(fakeServices(route => { handler = route.handler }))
assert.equal(typeof handler, 'function', 'the route handler was registered')

// The fold runs in the background; give it a moment to land.
await settle()

const payload = await readRoute(handler)
assert.equal(payload.days.length, 2, 'two days carry usage')

const [first, second] = payload.days
assert.equal(first.day, '2026-11-23')
assert.equal(first.models['mini/MiniMax-M3.1-Flash'].input, 100)
assert.equal(first.models['mini/MiniMax-M3.1-Flash'].output, 20)
assert.equal(first.models['mini/MiniMax-M3.1-Flash'].cacheRead, 900)
assert.equal(first.models['mini/MiniMax-M3.1-Flash'].calls, 1)

assert.equal(second.day, '2026-11-24')
assert.equal(second.models['mini/MiniMax-M3.1-Flash'].input, 5)
assert.equal(second.models['deepseek/deepseek-chat'].input, 7)
assert.equal(second.models['deepseek/deepseek-chat'].calls, 1)

// The plan rows of the last probe are restored from the ledger, so a start
// shows the plans before the providers answered again.
assert.equal(payload.plans.length, 1, 'the stored plan rows came back')
assert.equal(payload.plans[0].id, 'plan-mini')
assert.equal(payload.plans[0].windows[0].remaining, 60)
assert.equal(payload.plansReady, true, 'the Host already looked for plans')

// Now the provider answers: its row joins the restored ones.
answerAll({ ok: true, json: async () => MINIMAX_ANSWER })
await settle()

const fresh = await readRoute(handler)
assert.equal(fresh.plans.length, 2, 'the answered provider added its row')
assert.equal(fresh.plans[1].id, 'plan-minimax')
assert.equal(fresh.plans[1].windows[0].remaining, 50)
assert.equal(fresh.plans[1].windows[1].remaining, 80)

// --- A machine that never ran the plugin: no ledger, no plan rows yet ---

process.env.DSH_PROFILE_DIR = mkdtempSync(join(tmpdir(), 'dsh-token-heatmap-'))

pending = []
let handlerFresh
apply(fakeServices(route => { handlerFresh = route.handler }))
await settle()

const empty = await readRoute(handlerFresh)
assert.equal(empty.plans.length, 0, 'no plan rows yet')
assert.equal(empty.plansReady, false, 'the Host is still looking for plans')

answerAll({ ok: true, json: async () => MINIMAX_ANSWER })
await settle()

const answered = await readRoute(handlerFresh)
assert.equal(answered.plansReady, true, 'the Host says it looked for plans')
assert.equal(answered.plans.length, 1, 'the provider row arrived')
assert.equal(answered.plans[0].id, 'plan-minimax')
assert.equal(answered.plans[0].stale, false, 'the row is fresh')

// --- A provider that stops answering: the row says it is the last one ---

// The probe only runs when the rows are stale, so ask for a fresh one. The
// provider answers with an error now, on every candidate it tries.
await handlerFresh({ method: 'GET', url: '/token-heatmap/usage?fresh=1' }, response)
await answerAllRounds({ ok: false, status: 401, json: async () => ({}) })
const stale = await readRoute(handlerFresh)
assert.equal(stale.plans.length, 1, 'the last known row is still there')
assert.equal(stale.plans[0].stale, true, 'the row says it is the last known result')

console.log('fold test passed')

// The plugin's background refresh keeps a timer alive.
process.exit(0)

/**
 * The plan probes.
 *
 * The harness ships no plan or quota service of its own, so every plan is
 * read from the provider. This module owns the little HTTP work and the
 * parsing that turns a provider answer into one plan with its windows.
 *
 * A plan carries windows, not one number: a coding plan usually has a short
 * interval window and a weekly one, and the user wants to see both.
 *
 * Every vendor is one entry in the registry below, so covering another one
 * is a data change: which routes and hosts it answers on, where to ask, how
 * to authenticate, and how to read the answer.
 */

/**
 * The window names the providers' windows map to.
 *
 * @param {string} key - the window key the provider used.
 * @param {number} [seconds] - the window's length in seconds, when known.
 * @returns {string} the window name.
 */
export function windowLabel(key, seconds) {
  if (key === 'week' || key === 'weekly') return '周窗口'
  if (key === 'month' || key === 'monthly') return '月窗口'
  if (key === 'day' || key === 'daily') return '日窗口'
  if (key === '5h' || key === 'interval' || key === 'rolling') return '5 小时窗口'
  if (typeof seconds === 'number' && Number.isFinite(seconds)) {
    const hours = seconds / 3600
    if (hours >= 20 && hours <= 28) return '日窗口'
    if (hours >= 4 && hours <= 6) return '5 小时窗口'
    if (hours >= 6 * 24 && hours <= 8 * 24) return '周窗口'
    if (hours >= 27 * 24 && hours <= 32 * 24) return '月窗口'
    return `${Math.round(hours)} 小时窗口`
  }
  return '额度窗口'
}

/**
 * Build one window from a used percentage.
 *
 * @param {object} input - the window facts.
 * @param {string} input.key - the provider's window key.
 * @param {string} input.name - the window's display name.
 * @param {number} input.used - the used percentage, 0 to 100.
 * @param {number} [input.resetsAt] - the reset time in epoch milliseconds.
 * @param {string} [input.detail] - the provider's own numbers, when it has
 *   a unit the percentage hides.
 * @returns {object} the window.
 */
function usedWindow({ key, name, used, resetsAt, detail }) {
  const clamped = Math.max(0, Math.min(100, used))
  return { key, name, used: clamped, remaining: 100 - clamped, resetsAt, detail }
}

/**
 * The configured routes of the llm-pi-ai provider.
 *
 * @param {object} ctx - the Host plugin context.
 * @returns {object[]} the configured routes.
 */
export function configuredRoutes(ctx) {
  const editor = ctx.get('configEditor')
  if (editor === undefined) return []
  const rows = editor.configuration()
  const row = rows.find(entry => entry.entry?.options?.id === 'llm-pi-ai')
  if (row === undefined) return []
  const inherited = row.inherited?.providers ?? {}
  const override = row.override?.providers ?? {}
  return Object.entries({ ...inherited, ...override }).map(([id, profile]) => ({ id, ...profile }))
}

/**
 * The credential of one configured route.
 *
 * A route holds either an API key or an OAuth grant. The key comes from the
 * route's own credential record when there is one, and otherwise from the
 * environment reference the profile names.
 *
 * @param {object} ctx - the Host plugin context.
 * @param {object} route - the configured route.
 * @returns {Promise<object | null>} the credential, or null.
 */
export async function routeCredential(ctx, route) {
  const credentials = ctx.get('credentials')
  if (credentials === undefined) return null
  try {
    const record = await credentials.readRecord(`llm-pi-ai/${route.id}`)
    if (record?.kind === 'api-key' && typeof record.key === 'string' && record.key !== '') {
      return { kind: 'api-key', key: record.key }
    }
    if (record?.kind === 'grant') {
      const access = record.payload?.access
      if (typeof access === 'string' && access !== '') {
        return { kind: 'oauth', key: access, accountId: record.payload?.chatgpt_account_id }
      }
    }
  } catch {
    // A route without its own record falls back to the profile's reference.
  }
  if (typeof route.apiKeyEnv !== 'string') return null
  try {
    const resolved = await credentials.resolve(route.apiKeyEnv)
    return resolved?.value ? { kind: 'api-key', key: resolved.value } : null
  } catch {
    return null
  }
}

/**
 * Read one provider timestamp.
 *
 * @param {unknown} value - the provider's timestamp.
 * @returns {number | undefined} epoch milliseconds.
 */
export function parseTime(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000
  }
  if (typeof value === 'string' && value.length > 0) {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric > 1e12 ? numeric : numeric * 1000
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/**
 * The used percentage of one quota row.
 *
 * @param {object} row - the row with a used, a remaining and a limit.
 * @returns {number | undefined} the used percentage.
 */
function usedPercent(row) {
  const limit = Number(row?.limit)
  if (Number.isFinite(limit) && limit > 0) {
    const used = Number(row?.used)
    if (Number.isFinite(used)) return (100 * used) / limit
    const remaining = Number(row?.remaining)
    if (Number.isFinite(remaining)) return (100 * (limit - remaining)) / limit
  }
  const percentage = Number(row?.percentage)
  return Number.isFinite(percentage) ? percentage : undefined
}

/**
 * Read one JSON body.
 *
 * @param {string} url - the URL to read.
 * @param {Record<string, string>} headers - the request headers.
 * @returns {Promise<object | null>} the body, or null.
 */
async function readJson(url, headers) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

/**
 * The plan of one CommandCode route.
 *
 * The vendor splits its answer over three endpoints: the credit pool with
 * the window limits, the subscription with the period, and the spending of
 * the period.
 *
 * @param {object} route - the configured route.
 * @param {object} credential - the route's credential.
 * @returns {Promise<object | null>} the plan, or null when the route has none.
 */
async function probeCommandcode(route, credential) {
  let origin = 'https://api.commandcode.ai'
  try {
    origin = new URL(route.baseURL).origin
  } catch {
    // A route without a usable base URL keeps the default origin.
  }
  const headers = { authorization: `Bearer ${credential.key}` }
  const [credits, subscription, summary] = await Promise.all([
    readJson(`${origin}/alpha/billing/credits`, headers),
    readJson(`${origin}/alpha/billing/subscriptions`, headers),
    readJson(`${origin}/alpha/usage/summary`, headers),
  ])
  const windows = parseCommandcodeWindows(credits, subscription, summary)
  if (windows.length === 0) return null
  const planId = subscription?.data?.planId
  const tier = typeof planId === 'string' ? COMMANDCODE_PLANS[planId] : undefined
  return {
    id: `plan-${route.id}`,
    provider: route.id,
    label: tier === undefined
      ? `CommandCode 套餐 · ${route.id}`
      : `CommandCode 套餐 · ${route.id}（${tier.name}）`,
    windows,
  }
}
/**
 * The plan windows in one MiniMax answer.
 *
 * @param {object} body - the provider's answer.
 * @returns {object[]} the windows.
 */
export function parseMinimaxWindows(body) {
  if (body === null || typeof body !== 'object') return []
  const envelope = body.base_resp
  if (envelope !== undefined && envelope?.status_code !== undefined && envelope.status_code !== 0) return []
  const remains = body.model_remains ?? body.data?.model_remains
  if (!Array.isArray(remains)) return []
  const row = remains.find(entry => entry?.model_name === 'general')
  if (row === null || typeof row !== 'object') return []
  const windows = []
  const interval = Number(row.current_interval_remaining_percent)
  if (Number.isFinite(interval)) {
    windows.push(usedWindow({
      key: 'interval',
      name: windowLabel('interval'),
      used: 100 - interval,
      resetsAt: parseTime(row.end_time),
    }))
  }
  if (row.current_weekly_status === 1) {
    const weekly = Number(row.current_weekly_remaining_percent)
    if (Number.isFinite(weekly)) {
      windows.push(usedWindow({
        key: 'week',
        name: windowLabel('week'),
        used: 100 - weekly,
        resetsAt: parseTime(row.weekly_end_time),
      }))
    }
  }
  return windows
}

/**
 * The plan windows in one Kimi For Coding answer.
 *
 * @param {object} body - the provider's answer.
 * @returns {object[]} the windows.
 */
export function parseKimiWindows(body) {
  if (body === null || typeof body !== 'object') return []
  const windows = []
  const limits = Array.isArray(body.limits) ? body.limits : []
  for (const limit of limits) {
    const detail = limit?.detail ?? limit
    const window = limit?.window ?? body.window
    const duration = Number(window?.duration)
    const unit = typeof window?.timeUnit === 'string' ? window.timeUnit : undefined
    const hours = unit === 'TIME_UNIT_MINUTE' ? duration / 60 : duration
    const used = usedPercent(detail)
    if (used === undefined) continue
    windows.push(usedWindow({
      key: typeof detail?.name === 'string' ? detail.name : `limit-${windows.length}`,
      name: windowLabel('', hours * 3600),
      used,
      resetsAt: parseTime(detail?.resetTime),
    }))
  }
  const usage = body.usage
  if (usage !== null && typeof usage === 'object') {
    const used = usedPercent(usage)
    if (used !== undefined) {
      windows.push(usedWindow({
        key: 'week',
        name: windowLabel('week'),
        used,
        resetsAt: parseTime(usage.resetTime),
      }))
    }
  }
  return windows
}

/**
 * The plan windows in one GLM / Z.ai answer.
 *
 * @param {object} body - the provider's answer.
 * @returns {object[]} the windows.
 */
export function parseGlmWindows(body) {
  if (body === null || typeof body !== 'object') return []
  if (body.success !== true) return []
  const limits = Array.isArray(body.data?.limits) ? body.data.limits : []
  const kinds = { 3: '5h', 5: 'month', 6: 'week' }
  const windows = []
  for (const limit of limits) {
    // The MCP request cap is a per-minute request budget, not a plan window.
    if (limit?.type !== 'TOKENS_LIMIT' && limit?.type !== 'CREDIT_LIMIT') continue
    const key = kinds[Number(limit?.unit)]
    if (key === undefined) continue
    let used
    if (limit.type === 'CREDIT_LIMIT') {
      const current = Number(limit.currentValue)
      const quota = Number(limit.usage)
      used = Number.isFinite(current) && Number.isFinite(quota) && quota > 0
        ? (100 * current) / quota
        : Number(limit.percentage)
    } else {
      used = Number(limit.percentage)
    }
    if (!Number.isFinite(used)) continue
    windows.push(usedWindow({
      key,
      name: windowLabel(key),
      used,
      resetsAt: parseTime(limit.nextResetTime),
    }))
  }
  return windows
}

/**
 * The plan windows in one OpenCode Go answer.
 *
 * @param {object} body - the provider's answer.
 * @returns {object[]} the windows.
 */
export function parseOpencodeWindows(body) {
  if (body === null || typeof body !== 'object') return []
  const usage = body.usage ?? body.data?.usage
  if (usage === null || typeof usage !== 'object') return []
  const kinds = [['rolling', '5h'], ['weekly', 'week'], ['monthly', 'month']]
  const windows = []
  for (const [field, key] of kinds) {
    const entry = usage[field]
    if (entry === null || typeof entry !== 'object') continue
    const percent = Number(entry.percent)
    if (!Number.isFinite(percent)) continue
    windows.push(usedWindow({
      key,
      name: windowLabel(key),
      used: percent,
      // A zero percent carries a placeholder reset time; drop it.
      resetsAt: percent === 0 ? undefined : parseTime(entry.resetsAt),
    }))
  }
  return windows
}

/**
 * The plan windows in one Codex / ChatGPT answer.
 *
 * @param {object} body - the provider's answer.
 * @returns {object[]} the windows.
 */
export function parseCodexWindows(body) {
  if (body === null || typeof body !== 'object') return []
  const rateLimit = body.rate_limit
  if (rateLimit === null || typeof rateLimit !== 'object') return []
  const rows = [rateLimit.primary_window, rateLimit.secondary_window]
  const windows = []
  for (const row of rows) {
    if (row === null || typeof row !== 'object') continue
    const percent = Number(row.used_percent)
    if (!Number.isFinite(percent)) continue
    const seconds = Number(row.limit_window_seconds)
    windows.push(usedWindow({
      key: `w-${Number.isFinite(seconds) ? seconds : windows.length}`,
      name: windowLabel('', Number.isFinite(seconds) ? seconds : undefined),
      used: percent,
      resetsAt: parseTime(row.reset_at),
    }))
  }
  return windows
}

/**
 * The names and the allowances of the CommandCode plans.
 *
 * The vendor names its plans by an internal id and reports how many credits
 * are left, not how many the plan has. The allowance is what turns the
 * remaining credits into a share.
 */
const COMMANDCODE_PLANS = {
  'individual-go': { name: 'Go', credits: 10 },
  'individual-go-v1': { name: 'Go', credits: 10 },
  'individual-goat': { name: 'GOAT', credits: 70 },
  'individual-pro': { name: 'Pro', credits: 30 },
  'individual-pro-v1': { name: 'Pro', credits: 80 },
  'individual-provider': { name: 'Provider', credits: 15 },
  'individual-max': { name: 'Max', credits: 150 },
  'individual-ultra': { name: 'Ultra', credits: 300 },
  'teams-pro': { name: 'Teams Pro', credits: 40 },
}

/**
 * The plan windows in one CommandCode answer.
 *
 * CommandCode answers three questions in three endpoints: the credit pool,
 * the subscription and the spending of the period. The windows are credits,
 * not a percentage the provider sends, so the share is computed here. The
 * credit amounts travel with the window, because a share of a few percent
 * says nothing about how much is left.
 *
 * @param {object} credits - the answer of the billing-credits endpoint.
 * @param {object} subscription - the answer of the subscriptions endpoint.
 * @param {object} summary - the answer of the usage-summary endpoint.
 * @returns {object[]} the windows.
 */
export function parseCommandcodeWindows(credits, subscription, summary) {
  const windows = []
  const limits = credits?.windowLimits
  const rows = [['fiveHour', '5h'], ['weekly', 'week']]
  for (const [field, key] of rows) {
    const row = limits?.[field]
    if (row === null || typeof row !== 'object') continue
    const cap = Number(row.cap)
    const used = Number(row.used)
    if (!Number.isFinite(cap) || cap <= 0 || !Number.isFinite(used)) continue
    windows.push(usedWindow({
      key,
      name: windowLabel(key),
      used: (100 * used) / cap,
      resetsAt: parseTime(row.resetAt),
      detail: `$${used.toFixed(2)} / $${cap.toFixed(2)}`,
    }))
  }
  const pool = credits?.credits
  const monthly = Number(pool?.monthlyCredits)
  const purchased = Number(pool?.purchasedCredits ?? 0)
  const free = Number(pool?.freeCredits ?? 0)
  const remaining = (Number.isFinite(monthly) ? monthly : 0)
    + (Number.isFinite(purchased) ? purchased : 0)
    + (Number.isFinite(free) ? free : 0)
  const spent = Number(summary?.totalCost)
  const tier = COMMANDCODE_PLANS[subscription?.data?.planId]
  // The pool is the plan's allowance; without a known plan the spending and
  // what is left add up to it.
  const total = tier === undefined
    ? (Number.isFinite(spent) ? spent : 0) + remaining
    : Math.max(tier.credits, Number.isFinite(monthly) ? monthly : 0)
      + (Number.isFinite(purchased) ? purchased : 0)
      + (Number.isFinite(free) ? free : 0)
  if (total > 0) {
    const used = total - remaining
    windows.push(usedWindow({
      key: 'month',
      name: windowLabel('month'),
      used: (100 * used) / total,
      resetsAt: parseTime(subscription?.data?.currentPeriodEnd),
      detail: `$${used.toFixed(2)} / $${total.toFixed(2)}`,
    }))
  }
  return windows
}

/**
 * The plan families the Host can read.
 *
 * `routeIds` names the harness's own provider ids; `hosts` names the vendor
 * endpoints a custom route id may point at. `candidates` says where to ask
 * and how to authenticate, `parse` reads the answer. A family that needs
 * more than one endpoint brings its own `probe` instead.
 */
export const FAMILIES = [
  {
    id: 'minimax',
    label: 'MiniMax 套餐',
    routeIds: ['minimax', 'minimax-cn'],
    hosts: [
      { host: 'api.minimaxi.com', pathPrefix: '' },
      { host: 'api.minimax.io', pathPrefix: '' },
      { host: 'api.minimax.cn', pathPrefix: '' },
    ],
    candidates: origin => [
      { url: `${origin}/v1/api/openplatform/coding_plan/remains`, headers: key => ({ authorization: `Bearer ${key}` }) },
      { url: `${origin}/v1/coding_plan/remains`, headers: key => ({ authorization: key }) },
    ],
    parse: parseMinimaxWindows,
  },
  {
    id: 'commandcode',
    label: 'CommandCode 套餐',
    routeIds: ['command', 'command-code', 'commandcode'],
    hosts: [{ host: 'api.commandcode.ai', pathPrefix: '/provider' }],
    probe: probeCommandcode,
  },
  {
    id: 'kimi',
    label: 'Kimi 套餐',
    routeIds: ['kimi-coding'],
    hosts: [{ host: 'api.kimi.com', pathPrefix: '/coding' }],
    candidates: origin => [
      { url: `${origin}/coding/v1/usages`, headers: key => ({ authorization: `Bearer ${key}` }) },
    ],
    parse: parseKimiWindows,
  },
  {
    id: 'glm',
    label: 'GLM 套餐',
    routeIds: ['zai', 'zai-coding-cn'],
    hosts: [
      { host: 'open.bigmodel.cn', pathPrefix: '' },
      { host: 'api.z.ai', pathPrefix: '' },
    ],
    candidates: origin => [
      { url: `${origin}/api/monitor/usage/quota/limit`, headers: key => ({ authorization: key, 'accept-language': 'en-US,en' }) },
    ],
    parse: parseGlmWindows,
  },
  {
    id: 'opencode',
    label: 'OpenCode 套餐',
    routeIds: ['opencode-go'],
    hosts: [{ host: 'opencode.ai', pathPrefix: '/zen/go' }],
    candidates: origin => [
      { url: `${origin}/zen/go/v1/usage`, headers: key => ({ authorization: `Bearer ${key}` }) },
    ],
    parse: parseOpencodeWindows,
  },
  {
    id: 'codex',
    label: 'Codex 套餐',
    routeIds: ['openai-codex'],
    hosts: [{ host: 'chatgpt.com', pathPrefix: '/backend-api' }],
    candidates: origin => [
      {
        url: `${origin}/backend-api/wham/usage`,
        headers: (key, credential) => ({
          authorization: `Bearer ${key}`,
          'user-agent': 'codex-cli',
          accept: 'application/json',
          ...(credential?.accountId !== undefined ? { 'chatgpt-account-id': credential.accountId } : {}),
        }),
      },
    ],
    parse: parseCodexWindows,
  },
]

/**
 * The plan family of one configured route.
 *
 * A route id the harness knows wins; a custom route id falls back to the
 * vendor endpoint its base URL points at.
 *
 * @param {object} route - the configured route.
 * @returns {object | null} the family, or null.
 */
export function planFamily(route) {
  const byId = FAMILIES.find(family => family.routeIds.includes(route.id))
  if (byId !== undefined) return byId
  let url
  try {
    url = new URL(route.baseURL)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  const host = url.hostname.toLowerCase()
  const path = url.pathname
  return FAMILIES.find(family => family.hosts.some(rule =>
    rule.host === host
    && (rule.pathPrefix === '' || path === rule.pathPrefix || path.startsWith(`${rule.pathPrefix}/`)),
  )) ?? null
}

/**
 * The plan of one configured route.
 *
 * @param {object} route - the configured route.
 * @param {object} credential - the route's credential.
 * @returns {Promise<{ plan: object | null, failed: boolean }>} the plan, and
 *   whether the provider stopped answering. A route that carries no plan at
 *   all is not a failure.
 */
export async function routePlan(route, credential) {
  const family = planFamily(route)
  if (family === null) return { plan: null, failed: false }
  // A vendor that answers over more than one endpoint brings its own probe.
  if (typeof family.probe === 'function') {
    const plan = await family.probe(route, credential)
    return { plan, failed: plan === null }
  }
  let origin = 'https://api.minimax.cn'
  try {
    origin = new URL(route.baseURL).origin
  } catch {
    // A route without a usable base URL keeps the default origin.
  }
  for (const candidate of family.candidates(origin)) {
    const body = await readJson(candidate.url, candidate.headers(credential.key, credential))
    const windows = family.parse(body)
    if (windows.length > 0) {
      return {
        plan: {
          id: `plan-${route.id}`,
          provider: route.id,
          label: `${family.label} · ${route.id}`,
          windows,
        },
        failed: false,
      }
    }
  }
  return { plan: null, failed: true }
}

/**
 * The fingerprint of the configured routes.
 *
 * The fingerprint changes when a route is added, removed or repointed, so
 * the Host knows that the plan rows it holds are out of date even when they
 * are still young.
 *
 * @param {object[]} routes - the configured routes.
 * @returns {string} the fingerprint.
 */
export function routeSignature(routes) {
  return routes
    .map(route => `${route.id}|${route.baseURL ?? ''}|${route.apiKeyEnv ?? ''}`)
    .sort()
    .join('\n')
}

/**
 * The plans of every route that answers.
 *
 * The result names the routes that stopped answering, so the Host can say
 * that a row is the last known one instead of passing it off as fresh.
 *
 * @param {object} ctx - the Host plugin context.
 * @returns {Promise<{ plans: object[], failed: string[] }>} the plans and the
 *   routes that did not answer.
 */
export async function probePlans(ctx) {
  const routes = configuredRoutes(ctx)
  const probed = await Promise.all(routes.map(async (route) => {
    const credential = await routeCredential(ctx, route)
    if (credential === null) return { route, plan: null, failed: false }
    const answer = await routePlan(route, credential)
    return { route, plan: answer.plan, failed: answer.failed }
  }))
  return {
    plans: probed.filter(row => row.plan !== null).map(row => row.plan),
    failed: probed.filter(row => row.failed).map(row => row.route.id),
  }
}

/**
 * The shared usage read.
 *
 * Both surfaces read the same Host route: the settings page and the sidebar
 * card. The Host answers from its ledger, so a read is a small JSON fetch.
 *
 * The read repeats on its own timer. Right after a start the Host still has
 * to fold the corpus and to ask the providers for their plan rows, so the
 * hook reads quickly while the answer is incomplete and slows down to the
 * normal interval once the answer is whole. That way a start shows the plans
 * as soon as the Host has them instead of after the next long tick.
 */

/** The route the Host answers with the folded usage. */
export const USAGE_URL = '/token-heatmap/usage'

/** How quickly the hook reads again while the answer is still incomplete. */
const QUICK_READ_MS = 2_000

/** How many quick reads the hook makes before it waits for the normal tick. */
const QUICK_READ_LIMIT = 20

/** How old a plan row may be before the answer counts as incomplete. */
const PLAN_STALE_MS = 90_000

/**
 * Read the folded usage from the Host.
 *
 * @param {boolean} fresh - whether the Host should refold instead of reusing
 *   its ledger.
 * @returns {Promise<object>} the payload.
 */
export async function fetchUsage(fresh) {
  const response = await fetch(`${USAGE_URL}${fresh ? '?fresh=1' : ''}`, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

/**
 * Whether an answer carries the plan rows the user expects to see.
 *
 * The Host restores its last known rows from the ledger, so a plan is known
 * right away; the rows themselves are only fresh once the Host asked the
 * providers again.
 *
 * @param {object} payload - the Host's answer.
 * @returns {boolean} true when the plan rows are present and fresh.
 */
export function answerComplete(payload) {
  const plans = payload?.plans ?? []
  if (plans.length === 0) return false
  const probedAt = Number(payload?.plansAt ?? 0)
  if (!Number.isFinite(probedAt) || probedAt <= 0) return false
  return Date.now() - probedAt <= PLAN_STALE_MS
}

/**
 * Load the usage and keep it fresh while the surface is mounted.
 *
 * @param {number} intervalMs - how often the usage is read again once the
 *   answer is complete.
 * @returns {object} the usage state and the reload function.
 */
export function useUsage(intervalMs = 30_000) {
  const [state, setState] = React.useState({ status: 'loading', days: [], plans: [], plansAt: 0, updatedAt: 0, refreshing: false })
  const pending = React.useRef(0)

  const load = React.useCallback(async (fresh) => {
    try {
      const payload = await fetchUsage(fresh)
      pending.current = answerComplete(payload) ? 0 : pending.current + 1
      setState({
        status: 'ready',
        days: payload.days ?? [],
        plans: payload.plans ?? [],
        plansAt: payload.plansAt ?? 0,
        updatedAt: payload.updatedAt ?? 0,
        refreshing: payload.refreshing === true,
      })
    } catch (error) {
      pending.current += 1
      setState(previous => ({ ...previous, status: 'failed', error: String(error?.message ?? error) }))
    }
  }, [])

  React.useEffect(() => {
    let stopped = false
    let timer = undefined
    const tick = async () => {
      await load(false)
      if (stopped) return
      const delay = pending.current < QUICK_READ_LIMIT ? QUICK_READ_MS : intervalMs
      timer = setTimeout(tick, delay)
    }
    void tick()
    return () => {
      stopped = true
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [load, intervalMs])

  return { ...state, load }
}

/**
 * The shared usage read.
 *
 * Both surfaces read the same Host route: the settings page and the sidebar
 * card. The Host answers from its ledger, so a read is a small JSON fetch.
 */

/** The route the Host answers with the folded usage. */
export const USAGE_URL = '/token-heatmap/usage'

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
 * Load the usage and keep it fresh while the surface is mounted.
 *
 * @param {number} intervalMs - how often the usage is read again.
 * @returns {object} the usage state and the reload function.
 */
export function useUsage(intervalMs = 30_000) {
  const [state, setState] = React.useState({ status: 'loading', days: [], plans: [], updatedAt: 0, refreshing: false })

  const load = React.useCallback(async (fresh) => {
    try {
      const payload = await fetchUsage(fresh)
      setState({
        status: 'ready',
        days: payload.days ?? [],
        plans: payload.plans ?? [],
        updatedAt: payload.updatedAt ?? 0,
        refreshing: payload.refreshing === true,
      })
    } catch (error) {
      setState(previous => ({ ...previous, status: 'failed', error: String(error?.message ?? error) }))
    }
  }, [])

  React.useEffect(() => {
    void load(false)
    const timer = setInterval(() => void load(false), intervalMs)
    return () => clearInterval(timer)
  }, [load, intervalMs])

  return { ...state, load }
}

/**
 * The shared formatters.
 *
 * Both surfaces format the same facts, so the formatters live here once.
 */

/**
 * Format a token count the way the host's own statistics do: a short scale
 * with two decimals for millions and billions, an exact count below a
 * thousand.
 *
 * @param {number} value - the token count.
 * @returns {string} the formatted count.
 */
export function formatTokens(value) {
  const count = Number(value ?? 0)
  if (!Number.isFinite(count)) return '0'
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(2)}B`
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return `${Math.round(count)}`
}

/**
 * Format a plain count with thousand separators.
 *
 * @param {number} value - the count.
 * @returns {string} the formatted count.
 */
export function formatCount(value) {
  const count = Number(value ?? 0)
  if (!Number.isFinite(count)) return '0'
  return Math.round(count).toLocaleString('en-US')
}

/**
 * The percentage of the prompt tokens that came from the cache.
 *
 * @param {object} totals - the summed buckets.
 * @returns {number} the rate from 0 to 1.
 */
export function cacheHitRate(totals) {
  const context = (totals.input ?? 0) + (totals.cacheRead ?? 0) + (totals.cacheWrite ?? 0)
  return context > 0 ? (totals.cacheRead ?? 0) / context : 0
}

/**
 * The clock time a window resets at.
 *
 * @param {number | undefined} resetsAt - epoch milliseconds.
 * @param {boolean} withDate - whether the date is part of the text.
 * @returns {string} the time.
 */
export function resetTime(resetsAt, withDate = false) {
  if (typeof resetsAt !== 'number' || resetsAt <= 0) return ''
  const options = withDate
    ? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit' }
  return new Date(resetsAt).toLocaleString('zh-CN', options)
}

/**
 * The percentage of a window that is left.
 *
 * A window that was barely touched must not read as a full one, so a share
 * that is not exactly zero or full keeps one decimal.
 *
 * @param {number} remaining - the share that is left, 0 to 100.
 * @returns {string} the percentage text.
 */
export function remainingPercent(remaining) {
  const value = Number(remaining ?? 0)
  if (!Number.isFinite(value)) return '0'
  if (value > 99.9 && value < 100) return '99.9'
  if (value > 0 && value < 0.1) return '<0.1'
  if (value > 0 && value < 99.9) return value.toFixed(1)
  return `${Math.round(value)}`
}

/**
 * The width of a window's bar.
 *
 * A window that was used a little still has to show a sliver, otherwise the
 * bar looks empty and the card looks frozen.
 *
 * @param {number} used - the used share, 0 to 100.
 * @returns {string} the width.
 */
export function barWidth(used) {
  const value = Number(used ?? 0)
  if (!Number.isFinite(value) || value <= 0) return '0%'
  if (value >= 100) return '100%'
  return `max(2px, ${value.toFixed(2)}%)`
}

/**
 * The time left until a window resets.
 *
 * @param {number | undefined} resetsAt - epoch milliseconds.
 * @param {number} [now] - the current time in epoch milliseconds.
 * @returns {object | null} the days, hours and minutes left, or null.
 */
export function remainingSpan(resetsAt, now = Date.now()) {
  if (typeof resetsAt !== 'number' || resetsAt <= 0) return null
  const minutes = Math.floor((resetsAt - now) / 60_000)
  if (minutes <= 0) return null
  return {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
  }
}

/**
 * The text of the time left until a window resets.
 *
 * @param {object | null} span - the span from `remainingSpan`.
 * @param {function} t - the translate function.
 * @returns {string} the text.
 */
export function spanText(span, t) {
  if (span === null || span === undefined) return ''
  if (span.days > 0) {
    const days = t('span.days', { n: span.days })
    return span.hours > 0 ? `${days} ${t('span.hours', { n: span.hours })}` : days
  }
  if (span.hours > 0) return t('span.hours', { n: span.hours })
  return t('span.minutes', { n: span.minutes })
}

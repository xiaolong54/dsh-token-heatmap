/**
 * @xiaolong54/dsh-token-heatmap — generated Client module. Do not edit: run `node build.mjs`.
 */
window.__ModuleLoader__.load({
  id: "@xiaolong54/dsh-token-heatmap",
  factory(require) {
    const React = require('react')
    const h = React.createElement

// ---- src/i18n.js ----
/**
 * Copy for the token heatmap page.
 *
 * The plugin owns one locale namespace; the page never shows a raw key. The
 * dictionaries carry strings only — the weekday and month labels live beside
 * them, because a locale dictionary holds text, not lists.
 */

/** Simplified Chinese dictionary. */
const zh = {
  'title': 'Token 热力图',
  'description': '按天统计这台机器上的模型 Token 消耗，热力图按月排布。',
  'section': '按天消耗',
  'totalTokens': '总 Token',
  'cacheHitRate': '缓存命中率',
  'activeDays': '活跃天数',
  'peakDay': '单日峰值',
  'calls': '调用次数',
  'models': '模型',
  'plans': '套餐',
  'modelRows': '{n} 个模型',
  'input': '输入',
  'output': '输出',
  'cacheRead': '缓存读',
  'cacheWrite': '缓存写',
  'less': '少',
  'more': '多',
  'months': '个月',
  'refresh': '刷新',
  'refreshing': '正在刷新…',
  'loading': '正在读取用量…',
  'empty': '还没有用量记录。用一次模型请求后，这里就会出现每天的消耗。',
  'failed': '读取用量失败：{message}',
  'source': '数据来自本机会话日志',
  'updatedAt': '更新于 {time}',
  'todayLabel': '今日消耗',
  'monthTokens': '{tokens} Token · {days} 天有消耗',
  'previousMonth': '上一个月',
  'nextMonth': '下一个月',
  'noPlans': '未连接可查询余量的套餐',
  'checkingPlans': '正在读取套餐…',
  'plansFailed': '套餐读取失败，稍后重试',
  'windowRemaining': '剩 {percent}%',
  'resetsAt': '{time} 重置',
  'resetsIn': '{span}后重置（{time}）',
  'span.days': '{n} 天',
  'span.hours': '{n} 小时',
  'span.minutes': '{n} 分钟',
  'dayTooltip': '{day} · {tokens} Token · {calls} 次调用',
  'dayTooltipEmpty': '{day} · 没有消耗',
}

/** English dictionary. */
const en = {
  'title': 'Token heatmap',
  'description': 'Daily model token consumption on this machine, laid out by month.',
  'section': 'Daily consumption',
  'totalTokens': 'Total tokens',
  'cacheHitRate': 'Cache hit rate',
  'activeDays': 'Active days',
  'peakDay': 'Daily peak',
  'calls': 'Calls',
  'models': 'Models',
  'plans': 'Plans',
  'modelRows': '{n} models',
  'input': 'Input',
  'output': 'Output',
  'cacheRead': 'Cache read',
  'cacheWrite': 'Cache write',
  'less': 'Less',
  'more': 'More',
  'months': 'months',
  'refresh': 'Refresh',
  'refreshing': 'Refreshing…',
  'loading': 'Reading usage…',
  'empty': 'No usage recorded yet. Run one model request and the daily totals will appear here.',
  'failed': 'Could not read usage: {message}',
  'source': 'Data comes from this machine’s session logs',
  'updatedAt': 'Updated at {time}',
  'todayLabel': 'Today',
  'monthTokens': '{tokens} tokens · {days} active days',
  'previousMonth': 'Previous month',
  'nextMonth': 'Next month',
  'noPlans': 'No plan with a queryable remainder',
  'checkingPlans': 'Reading plans…',
  'plansFailed': 'Could not read the plans, retrying',
  'windowRemaining': '{percent}% left',
  'resetsAt': 'resets at {time}',
  'resetsIn': 'resets in {span} ({time})',
  'span.days': '{n}d',
  'span.hours': '{n}h',
  'span.minutes': '{n}m',
  'dayTooltip': '{day} · {tokens} tokens · {calls} calls',
  'dayTooltipEmpty': '{day} · no usage',
}

/** Weekday labels, Monday first. */
const WEEKDAYS = {
  zh: ['一', '二', '三', '四', '五', '六', '日'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}

/** Month labels. */
const MONTH_NAMES = {
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

/**
 * Whether a locale id names Chinese.
 *
 * @param {string | undefined} locale - the host's active locale id.
 * @returns {boolean} true for a Chinese locale.
 */
function isChinese(locale) {
  return typeof locale === 'string' && locale.toLowerCase().startsWith('zh')
}

/**
 * Bind a locale id to the dictionary pair.
 *
 * @param {string | undefined} locale - the host's active locale id.
 * @returns {function} a translate function with `{name}` interpolation.
 */
function bindTranslator(locale) {
  const dict = isChinese(locale) ? zh : en
  return (key, values) => {
    const template = dict[key] ?? en[key] ?? key
    if (values === undefined) return template
    return template.replace(/\{(\w+)\}/g, (match, name) => (
      values[name] === undefined ? match : String(values[name])
    ))
  }
}


// ---- src/styles.js ----
/**
 * One stylesheet for both surfaces.
 *
 * Every colour is a host theme token, so the page follows the light and dark
 * appearance without a second palette. The class prefix keeps the selectors
 * out of the host's namespace.
 */

const HEATMAP_CSS = `
.thm-page{display:flex;flex-direction:column;gap:16px;padding:8px 0;font-size:13px;line-height:22px;color:var(--dsw-alias-label-primary);}
.thm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
.thm-head-text{display:flex;flex-direction:column;gap:2px;min-width:0;}
.thm-title{font-size:14px;font-weight:600;}
.thm-desc{font-size:12px;color:var(--dsw-alias-label-tertiary);}
.thm-btn{appearance:none;height:30px;min-width:72px;padding:0 12px;font-size:12px;line-height:20px;border:0.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;font-family:inherit;white-space:nowrap;}
.thm-btn:hover{background:var(--dsw-alias-interactive-bg-hover);}
.thm-btn:disabled{opacity:.5;cursor:default;}
.thm-card{padding:12px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill);}
.thm-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px;}
.thm-card-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);}
.thm-card-note{font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-summary{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;}
.thm-total{display:flex;align-items:baseline;gap:6px;}
.thm-total-value{font-size:28px;font-weight:600;line-height:32px;letter-spacing:-0.5px;}
.thm-total-unit{font-size:12px;color:var(--dsw-alias-label-tertiary);}
.thm-rate{display:flex;flex-direction:column;gap:4px;min-width:180px;}
.thm-rate-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-rate-value{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);}
.thm-bar{height:6px;border-radius:999px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);overflow:hidden;}
.thm-bar-fill{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);}
.thm-months-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(152px,1fr));gap:16px 20px;}
.thm-month{display:flex;flex-direction:column;gap:5px;}
.thm-month-title{font-size:11px;color:var(--dsw-alias-label-secondary);}
.thm-switch{display:flex;align-items:center;justify-content:center;gap:10px;margin:2px 0 10px;}
.thm-switch-label{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);min-width:110px;text-align:center;}
.thm-step{appearance:none;width:26px;height:26px;line-height:22px;font-size:16px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-family:inherit;}
.thm-step:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.thm-step:disabled{opacity:.35;cursor:default;}
.thm-columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;align-items:start;}
.thm-weekday-row,.thm-month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;max-width:340px;margin:0 auto;}
.thm-weekday{font-size:9px;line-height:10px;color:var(--dsw-alias-label-tertiary);text-align:center;}
.thm-cell{aspect-ratio:1/1;border-radius:3px;background:transparent;}
.thm-cell.empty{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1);}
.thm-cell.future{background:transparent;}
.thm-cell.today{box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary);}
.thm-cell.l1{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);}
.thm-cell.l2{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, transparent);}
.thm-cell.l3{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 74%, transparent);}
.thm-cell.l4{background:var(--dsw-alias-brand-primary);}
.thm-pad{background:transparent;}
.thm-legend{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:12px;font-size:10px;color:var(--dsw-alias-label-tertiary);}
.thm-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--dsw-alias-bg-layer-2);}
.thm-legend i.empty{background:color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1);}
.thm-legend i.l1{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);}
.thm-legend i.l2{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, transparent);}
.thm-legend i.l3{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 74%, transparent);}
.thm-legend i.l4{background:var(--dsw-alias-brand-primary);}
.thm-models{display:flex;flex-direction:column;}
.thm-model{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:0.5px solid var(--dsw-alias-border-l2);cursor:pointer;}
.thm-model:first-child{border-top:none;}
.thm-model:hover .thm-model-name{color:var(--dsw-alias-label-primary);}
.thm-model.is-active .thm-model-name{color:var(--dsw-alias-brand-primary);font-weight:600;}
.thm-dot{width:8px;height:8px;border-radius:50%;flex:none;background:var(--dsw-alias-brand-primary);}
.thm-model-name{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--dsw-alias-label-secondary);}
.thm-model-share{width:110px;height:6px;border-radius:999px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);overflow:hidden;flex:none;}
.thm-model-share i{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);}
.thm-model-tokens{flex:none;min-width:76px;text-align:right;font-size:12px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;}
.thm-stats{display:flex;gap:28px;flex-wrap:wrap;}
.thm-stat{display:flex;flex-direction:column;gap:2px;}
.thm-stat-label{font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-stat-value{font-size:16px;font-weight:600;font-variant-numeric:tabular-nums;}
.thm-note{font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-error{font-size:12px;color:var(--dsw-alias-state-error-primary);}
.thm-empty{padding:20px 4px;text-align:center;font-size:12px;color:var(--dsw-alias-label-tertiary);}
.thm-tip{position:fixed;z-index:60;padding:4px 8px;border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-overlay);border:0.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font-size:11px;line-height:16px;white-space:nowrap;pointer-events:none;box-shadow:var(--dsw-elevation-soft,0 2px 8px rgba(0,0,0,0.18));}
.thm-foot{display:flex;flex-direction:column;gap:8px;padding:4px 12px 10px;width:100%;}
.thm-foot-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;}
.thm-foot-label{font-size:11px;color:var(--dsw-alias-label-tertiary);}
.thm-foot-value{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;}
.thm-plans{display:flex;flex-direction:column;gap:6px;}
.thm-plan-select{position:relative;display:flex;flex-direction:column;gap:2px;}
.thm-plan-toggle{appearance:none;display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;padding:2px 4px;border:0.5px solid transparent;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;font-family:inherit;cursor:pointer;text-align:left;}
.thm-plan-toggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.thm-plan-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.thm-plan-caret{flex:none;font-size:9px;color:var(--dsw-alias-label-tertiary);}
.thm-plan-menu{display:flex;flex-direction:column;gap:1px;padding:2px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-bg-overlay);box-shadow:var(--dsw-elevation-soft,0 2px 8px rgba(0,0,0,0.18));}
.thm-plan-option{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;font-family:inherit;text-align:left;padding:3px 6px;border-radius:4px;cursor:pointer;}
.thm-plan-option:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.thm-plan-option.is-active{color:var(--dsw-alias-brand-primary);font-weight:600;}
.thm-window{display:flex;flex-direction:column;gap:3px;}
.thm-window-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;}
.thm-window-name{font-size:11px;color:var(--dsw-alias-label-secondary);}
.thm-window-value{font-size:11px;font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;flex:none;}
.thm-window-bar{height:4px;border-radius:999px;background:color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);overflow:hidden;}
.thm-window-bar i{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary);}
.thm-plan-note{font-size:10px;color:var(--dsw-alias-label-tertiary);}
.thm-plan-list{display:flex;flex-direction:column;gap:14px;}
.thm-plan-block{display:flex;flex-direction:column;gap:6px;padding-bottom:12px;border-bottom:0.5px solid var(--dsw-alias-border-l2);}
.thm-plan-block:last-child{padding-bottom:0;border-bottom:none;}
.thm-plan-block-name{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);}
.thm-page :focus-visible,.thm-foot :focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px;}
`


// ---- src/format.js ----
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
function formatTokens(value) {
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
function formatCount(value) {
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
function cacheHitRate(totals) {
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
function resetTime(resetsAt, withDate = false) {
  if (typeof resetsAt !== 'number' || resetsAt <= 0) return ''
  const options = withDate
    ? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit' }
  return new Date(resetsAt).toLocaleString('zh-CN', options)
}

/**
 * The time left until a window resets.
 *
 * @param {number | undefined} resetsAt - epoch milliseconds.
 * @param {number} [now] - the current time in epoch milliseconds.
 * @returns {object | null} the days, hours and minutes left, or null.
 */
function remainingSpan(resetsAt, now = Date.now()) {
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
function spanText(span, t) {
  if (span === null || span === undefined) return ''
  if (span.days > 0) {
    const days = t('span.days', { n: span.days })
    return span.hours > 0 ? `${days} ${t('span.hours', { n: span.hours })}` : days
  }
  if (span.hours > 0) return t('span.hours', { n: span.hours })
  return t('span.minutes', { n: span.minutes })
}


// ---- src/heatmap.js ----
/**
 * Pure layout helpers for the token heatmap.
 *
 * The grid is laid out month by month: every month is its own block of the
 * month's days, one cell per day, so a month reads as the roughly thirty
 * cells it has. Everything here is pure so the page can recompute the grid
 * whenever the selected model or the fetched data changes.
 */

/** Weekday index of a `Date`, with Monday as 0. */
function weekdayIndex(date) {
  return (date.getDay() + 6) % 7
}

/** Format a `Date` as `YYYY-MM-DD` in local time. */
function formatDay(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Shift a date by whole days. */
function addDays(date, amount) {
  const next = new Date(date.getTime())
  next.setDate(next.getDate() + amount)
  return next
}

/** First day of the month that holds `date`. */
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Shift a month offset, always on the first of a month. */
function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

/** The number of days in the month that holds `date`. */
function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * Build the month blocks that cover the visible window.
 *
 * @param {Map<string, { total: number, calls: number }>} values - day totals.
 * @param {object} options - the window options.
 * @param {number} options.months - how many calendar months to show.
 * @param {Date} options.today - the last day of the window.
 * @returns {object[]} the month blocks, oldest first.
 */
function monthBlocks(values, { months = 12, today = new Date() } = {}) {
  const blocks = []
  const last = startOfMonth(today)
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const monthStart = addMonths(last, -offset)
    const year = monthStart.getFullYear()
    const month = monthStart.getMonth()
    const total = daysInMonth(monthStart)
    const cells = []
    for (let day = 1; day <= total; day += 1) {
      const date = new Date(year, month, day)
      const text = formatDay(date)
      const value = values.get(text)
      cells.push({
        day,
        date,
        text,
        future: date > today,
        today: text === formatDay(today),
        total: value ? value.total : 0,
        calls: value ? value.calls : 0,
      })
    }
    blocks.push({
      key: `${year}-${month + 1}`,
      year,
      month,
      leading: weekdayIndex(monthStart),
      cells,
    })
  }
  return blocks
}

/**
 * The months of the visible window, newest first.
 *
 * @param {object} options - the window options.
 * @param {number} options.months - how many calendar months to offer.
 * @param {Date} options.today - the last day of the window.
 * @returns {object[]} the months, newest first.
 */
function monthList({ months = 12, today = new Date() } = {}) {
  const list = []
  const last = startOfMonth(today)
  for (let offset = 0; offset < months; offset += 1) {
    const monthStart = addMonths(last, -offset)
    list.push({ key: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`, year: monthStart.getFullYear(), month: monthStart.getMonth() })
  }
  return list
}

/**
 * Build the month block of one month.
 *
 * @param {Map<string, { total: number, calls: number }>} values - day totals.
 * @param {object} options - the month options.
 * @param {number} options.year - the month's year.
 * @param {number} options.month - the month's zero-based month.
 * @param {Date} options.today - the current day.
 * @returns {object} the month block.
 */
function monthBlock(values, { year, month, today = new Date() } = {}) {
  const monthStart = new Date(year, month, 1)
  const total = daysInMonth(monthStart)
  const cells = []
  for (let day = 1; day <= total; day += 1) {
    const date = new Date(year, month, day)
    const text = formatDay(date)
    const value = values.get(text)
    cells.push({
      day,
      date,
      text,
      future: date > today,
      today: text === formatDay(today),
      total: value ? value.total : 0,
      calls: value ? value.calls : 0,
    })
  }
  return { key: `${year}-${month + 1}`, year, month, leading: weekdayIndex(monthStart), cells }
}

/**
 * The totals of one month.
 *
 * @param {Map<string, { total: number, calls: number }>} values - day totals.
 * @param {object} options - the month options.
 * @param {number} options.year - the month's year.
 * @param {number} options.month - the month's zero-based month.
 * @returns {object} the month's total, calls and active days.
 */
function monthTotals(values, { year, month }) {
  let total = 0
  let calls = 0
  let activeDays = 0
  const days = daysInMonth(new Date(year, month, 1))
  for (let day = 1; day <= days; day += 1) {
    const entry = values.get(formatDay(new Date(year, month, day)))
    if (entry === undefined) continue
    total += entry.total
    calls += entry.calls
    if (entry.total > 0) activeDays += 1
  }
  return { total, calls, activeDays }
}

/**
 * Pick the four intensity cut points the cells are drawn with.
 *
 * The cut points follow the contribution-graph convention: the thresholds are
 * the quartiles of the days that carry usage, so a calm month does not look
 * busy and a heavy day still reads as the peak.
 *
 * @param {number[]} values - the non-zero daily totals in range.
 * @returns {number[]} four ascending cut points.
 */
function intensityThresholds(values) {
  if (values.length === 0) return [0, 0, 0, 0]
  const sorted = [...values].sort((left, right) => left - right)
  const at = (fraction) => sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))]
  return [at(0.25), at(0.5), at(0.75), sorted[sorted.length - 1]]
}

/**
 * Map one daily total onto an intensity level from 0 (empty) to 4 (peak).
 *
 * @param {number} total - the day's total.
 * @param {number[]} thresholds - the ascending cut points.
 * @returns {number} the level.
 */
function intensityLevel(total, thresholds) {
  if (!total || total <= 0) return 0
  let level = 1
  for (const threshold of thresholds) {
    if (total > threshold) level += 1
  }
  return Math.min(4, level)
}

/**
 * Aggregate the fetched day rows into the numbers the page shows.
 *
 * @param {object[]} days - the day rows from the host.
 * @param {string | undefined} model - the selected model key, if any.
 * @returns {object} the totals, the day map and the per-model rows.
 */
function summarize(days, model) {
  const values = new Map()
  const models = new Map()
  let total = 0
  let calls = 0
  let input = 0
  let output = 0
  let cacheRead = 0
  let cacheWrite = 0
  let activeDays = 0

  for (const day of days) {
    let dayTotal = 0
    let dayCalls = 0
    for (const [key, entry] of Object.entries(day.models ?? {})) {
      const entryTotal = (entry.input ?? 0) + (entry.output ?? 0) + (entry.cacheRead ?? 0) + (entry.cacheWrite ?? 0)
      const row = models.get(key) ?? { key, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0, total: 0 }
      row.input += entry.input ?? 0
      row.output += entry.output ?? 0
      row.cacheRead += entry.cacheRead ?? 0
      row.cacheWrite += entry.cacheWrite ?? 0
      row.calls += entry.calls ?? 0
      row.total += entryTotal
      models.set(key, row)

      if (model === undefined || key === model) {
        dayTotal += entryTotal
        dayCalls += entry.calls ?? 0
      }
    }
    values.set(day.day, { total: dayTotal, calls: dayCalls })
    if (dayTotal > 0) activeDays += 1
    total += dayTotal
    calls += dayCalls
  }

  const modelRows = [...models.values()].sort((left, right) => right.total - left.total)
  for (const row of modelRows) {
    if (model === undefined || row.key === model) {
      input += row.input
      output += row.output
      cacheRead += row.cacheRead
      cacheWrite += row.cacheWrite
    }
  }

  const context = input + cacheRead + cacheWrite
  const cacheHitRate = context > 0 ? cacheRead / context : 0

  let peak = { day: '', total: 0, calls: 0 }
  for (const [day, entry] of values) {
    if (entry.total > peak.total) peak = { day, total: entry.total, calls: entry.calls }
  }

  return {
    values,
    models: modelRows,
    total,
    calls,
    input,
    output,
    cacheRead,
    cacheWrite,
    activeDays,
    peak,
    cacheHitRate,
  }
}


// ---- src/tooltip.js ----
/**
 * The shared hover bubble.
 *
 * Both surfaces show the same thing on hover: the day's token count. The
 * bubble follows the pointer and is rendered by the surface that owns the
 * hover state.
 */

/**
 * Track the hovered cell of one surface.
 *
 * @returns {object} the hover state and the handlers that set it.
 */
function useTooltip() {
  const [hover, setHover] = React.useState(null)
  const show = React.useCallback((event, content) => {
    setHover({ x: event.clientX, y: event.clientY, content })
  }, [])
  const hide = React.useCallback(() => setHover(null), [])
  return { hover, show, hide }
}

/**
 * The bubble itself.
 *
 * @param {object} props - the bubble props.
 * @param {object | null} props.hover - the hovered cell, if any.
 * @returns {object | null} the bubble element.
 */
function TooltipBubble({ hover }) {
  if (hover === null || hover === undefined) return null
  return h('div', {
    className: 'thm-tip',
    style: { left: `${hover.x + 14}px`, top: `${hover.y + 14}px` },
  }, hover.content)
}


// ---- src/usage.js ----
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
const USAGE_URL = '/token-heatmap/usage'

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
async function fetchUsage(fresh) {
  const response = await fetch(`${USAGE_URL}${fresh ? '?fresh=1' : ''}`, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

/**
 * Whether an answer carries the plan rows the user expects to see.
 *
 * The Host restores its last known rows from the ledger, so a plan is known
 * right away; the rows themselves are only fresh once the Host asked the
 * providers again. A Host that already looked and found nothing has nothing
 * more to send, so that answer is whole.
 *
 * @param {object} payload - the Host's answer.
 * @returns {boolean} true when the answer needs no follow-up read.
 */
function answerComplete(payload) {
  const plans = payload?.plans ?? []
  if (plans.length === 0) return payload?.plansReady === true
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
function useUsage(intervalMs = 30_000) {
  const [state, setState] = React.useState({
    status: 'loading',
    days: [],
    plans: [],
    plansAt: 0,
    plansReady: false,
    updatedAt: 0,
    refreshing: false,
  })
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
        plansReady: payload.plansReady === true,
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


// ---- src/plans.js ----
/**
 * The plan card.
 *
 * It lists every plan the machine is connected to, one block per plan, with
 * one bar per window. The sidebar card shows the plan the user picked; this
 * one shows them all at once.
 */



/**
 * One window of one plan: its name, what is left of it and its bar.
 *
 * @param {object} props - the window props.
 * @param {object} props.planWindow - the window the row shows.
 * @param {function} props.t - the translate function.
 * @returns {object} the window element.
 */
function PlanWindowRow(props) {
  const { planWindow, t } = props
  const resets = resetTime(planWindow.resetsAt, true)
  const span = spanText(remainingSpan(planWindow.resetsAt), t)
  const note = span === ''
    ? (resets === '' ? null : t('resetsAt', { time: resets }))
    : t('resetsIn', { span, time: resets })
  return h('div', { className: 'thm-window' },
    h('div', { className: 'thm-window-head' },
      h('span', { className: 'thm-window-name' }, planWindow.name),
      h('span', { className: 'thm-window-value' }, t('windowRemaining', { percent: Math.round(planWindow.remaining) }))),
    h('div', { className: 'thm-window-bar' }, h('i', { style: { width: `${Math.round(planWindow.used)}%` } })),
    note === null ? null : h('div', { className: 'thm-plan-note' }, note))
}

/**
 * The note that stands in for the plan rows while they are not there.
 *
 * A start is not the same as "no plan": the Host may still be asking the
 * providers, so the note says what is going on instead of claiming that
 * nothing is connected.
 *
 * @param {string} status - the read status: loading, failed or ready.
 * @param {function} t - the translate function.
 * @param {boolean} plansReady - whether the Host already looked for plans.
 * @returns {string} the note text.
 */
function planNote(status, t, plansReady) {
  if (status === 'loading') return t('checkingPlans')
  if (status === 'failed') return t('plansFailed')
  if (plansReady === false) return t('checkingPlans')
  return t('noPlans')
}

/**
 * The plan card: every connected plan with its windows.
 *
 * @param {object} props - the card props.
 * @param {object[]} props.plans - the connected plans.
 * @param {string} props.status - the read status of the usage.
 * @param {boolean} props.plansReady - whether the Host already looked.
 * @param {function} props.t - the translate function.
 * @returns {object} the card element.
 */
function PlansCard(props) {
  const { t, plans, status, plansReady } = props
  if (plans.length === 0) {
    return h('div', { className: 'thm-card' },
      h('div', { className: 'thm-card-head' }, h('span', { className: 'thm-card-title' }, t('plans'))),
      h('div', { className: 'thm-empty' }, planNote(status, t, plansReady)))
  }
  return h('div', { className: 'thm-card' },
    h('div', { className: 'thm-card-head' },
      h('span', { className: 'thm-card-title' }, t('plans')),
      h('span', { className: 'thm-card-note' }, t('modelRows', { n: plans.length }))),
    h('div', { className: 'thm-plan-list' },
      plans.map(plan => h('div', { key: plan.id, className: 'thm-plan-block' },
        h('div', { className: 'thm-plan-block-name' }, plan.label),
        plan.windows.map(planWindow => PlanWindowRow({ planWindow, t }))))))
}


// ---- src/page.js ----
/**
 * The token heatmap page.
 *
 * One settings page shows what the machine spent on models: the totals, a
 * month-by-month heatmap of the daily consumption, and the per-model
 * breakdown. Picking a model narrows the heatmap to that model.
 */









/** How many calendar months the heatmap covers. */
const MONTHS = 12

/**
 * The title of one month block.
 *
 * @param {object} block - the month block.
 * @param {object} props - the naming options.
 * @param {boolean} props.chinese - whether the copy is Chinese.
 * @returns {string} the month title.
 */
function monthTitle(block, { chinese }) {
  return chinese
    ? `${block.year}年${block.month + 1}月`
    : `${MONTH_NAMES.en[block.month]} ${block.year}`
}

/**
 * The hover text of one day.
 *
 * @param {object} props - the naming options.
 * @param {string} props.day - the day's text.
 * @param {number} props.total - the day's token total.
 * @param {number} props.calls - the day's call count.
 * @param {function} props.t - the translate function.
 * @returns {string} the bubble text.
 */
function dayText({ day, total, calls, t }) {
  return t('dayTooltip', { day, tokens: formatTokens(total), calls: formatCount(calls) })
}

/**
 * The heatmap card: one month at a time, with a month switcher.
 *
 * @param {object} props - the card props.
 * @returns {object} the card element.
 */
function HeatmapCard(props) {
  const { t, values, thresholds, months, index, onIndex, chinese, tooltip } = props
  const month = months[index]
  const block = monthBlock(values, { year: month.year, month: month.month })
  const totals = monthTotals(values, { year: month.year, month: month.month })

  const cells = []
  for (let index = 0; index < block.leading; index += 1) {
    cells.push(h('span', { key: `pad-${index}`, className: 'thm-pad' }))
  }
  for (const cell of block.cells) {
    const level = intensityLevel(cell.total, thresholds)
    const empty = cell.total <= 0
    const className = `thm-cell${cell.future ? ' future' : empty ? ' empty' : ` l${level}`}${cell.today ? ' today' : ''}`
    cells.push(h('span', {
      key: cell.text,
      className,
      onMouseEnter: event => tooltip.show(event, dayText({ day: cell.text, total: cell.total, calls: cell.calls, t })),
      onMouseMove: event => tooltip.show(event, dayText({ day: cell.text, total: cell.total, calls: cell.calls, t })),
      onMouseLeave: tooltip.hide,
    }))
  }

  return h('div', { className: 'thm-card' },
    h('div', { className: 'thm-card-head' },
      h('span', { className: 'thm-card-title' }, t('section')),
      h('span', { className: 'thm-card-note' },
        `${t('monthTokens', { tokens: formatTokens(totals.total), days: totals.activeDays })}`)),
    h('div', { className: 'thm-switch' },
      h('button', {
        className: 'thm-step',
        disabled: index >= months.length - 1,
        'aria-label': t('previousMonth'),
        onClick: () => onIndex(index + 1),
      }, '‹'),
      h('span', { className: 'thm-switch-label' }, monthTitle(block, { chinese })),
      h('button', {
        className: 'thm-step',
        disabled: index <= 0,
        'aria-label': t('nextMonth'),
        onClick: () => onIndex(index - 1),
      }, '›')),
    h('div', { className: 'thm-weekday-row' },
      WEEKDAYS[chinese ? 'zh' : 'en'].map((label, position) => h('span', { key: position, className: 'thm-weekday' }, label))),
    h('div', { className: 'thm-month-grid' }, cells),
    h('div', { className: 'thm-legend' },
      h('span', null, t('less')),
      h('i', { className: 'empty' }),
      h('i', { className: 'l1' }),
      h('i', { className: 'l2' }),
      h('i', { className: 'l3' }),
      h('i', { className: 'l4' }),
      h('span', null, t('more'))))
}

/**
 * The overview card: the total, the cache hit rate and the headline figures.
 *
 * @param {object} props - the card props.
 * @returns {object} the card element.
 */
function SummaryCard(props) {
  const { t, summary } = props
  const rate = cacheHitRate(summary)
  return h('div', { className: 'thm-card' },
    h('div', { className: 'thm-summary' },
      h('div', { className: 'thm-total' },
        h('span', { className: 'thm-total-value' }, formatTokens(summary.total)),
        h('span', { className: 'thm-total-unit' }, t('totalTokens'))),
      h('div', { className: 'thm-rate' },
        h('div', { className: 'thm-rate-head' },
          h('span', null, t('cacheHitRate')),
          h('span', { className: 'thm-rate-value' }, `${(rate * 100).toFixed(1)}%`)),
        h('div', { className: 'thm-bar' },
          h('div', { className: 'thm-bar-fill', style: { width: `${Math.round(rate * 100)}%` } })))),
    h('div', { className: 'thm-stats', style: { marginTop: '14px' } },
      h('div', { className: 'thm-stat' },
        h('span', { className: 'thm-stat-label' }, t('activeDays')),
        h('span', { className: 'thm-stat-value' }, formatCount(summary.activeDays))),
      h('div', { className: 'thm-stat' },
        h('span', { className: 'thm-stat-label' }, t('peakDay')),
        h('span', { className: 'thm-stat-value' }, formatTokens(summary.peak.total))),
      h('div', { className: 'thm-stat' },
        h('span', { className: 'thm-stat-label' }, t('calls')),
        h('span', { className: 'thm-stat-value' }, formatCount(summary.calls))),
      h('div', { className: 'thm-stat' },
        h('span', { className: 'thm-stat-label' }, t('input')),
        h('span', { className: 'thm-stat-value' }, formatTokens(summary.input))),
      h('div', { className: 'thm-stat' },
        h('span', { className: 'thm-stat-label' }, t('output')),
        h('span', { className: 'thm-stat-value' }, formatTokens(summary.output)))))
}

/**
 * The per-model breakdown. Every row filters the heatmap to that model.
 *
 * @param {object} props - the card props.
 * @returns {object} the card element.
 */
function ModelCard(props) {
  const { t, models, selected, onSelect } = props
  const largest = models.reduce((max, row) => Math.max(max, row.total), 0)
  const rows = models.map(row => h('div', {
    key: row.key,
    className: `thm-model${selected === row.key ? ' is-active' : ''}`,
    role: 'button',
    tabIndex: 0,
    title: row.key,
    onClick: () => onSelect(selected === row.key ? undefined : row.key),
    onKeyDown: event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect(selected === row.key ? undefined : row.key)
      }
    },
  },
  h('span', { className: 'thm-dot' }),
  h('span', { className: 'thm-model-name' }, row.key),
  h('span', { className: 'thm-model-share' }, h('i', {
    style: { width: `${largest > 0 ? Math.round((row.total / largest) * 100) : 0}%` },
  })),
  h('span', { className: 'thm-model-tokens' }, formatTokens(row.total))))

  return h('div', { className: 'thm-card' },
    h('div', { className: 'thm-card-head' },
      h('span', { className: 'thm-card-title' }, t('models')),
      h('span', { className: 'thm-card-note' }, t('modelRows', { n: models.length }))),
    models.length === 0
      ? h('div', { className: 'thm-empty' }, t('empty'))
      : h('div', { className: 'thm-models' }, rows))
}

/**
 * The card shown before any usage arrives, and after a failed read.
 *
 * @param {object} props - the placeholder props.
 * @returns {object} the placeholder element.
 */
function PlaceholderCard(props) {
  const { t, state, onRefresh } = props
  const message = state.status === 'failed'
    ? h('div', { className: 'thm-error' }, t('failed', { message: state.error ?? '' }))
    : h('div', { className: 'thm-empty' }, state.status === 'loading' ? t('loading') : t('empty'))
  return h('div', { className: 'thm-card' },
    message,
    h('div', null, h('button', { className: 'thm-btn', onClick: onRefresh }, t('refresh'))))
}

/**
 * The page component registered into the settings shell.
 *
 * @param {object} props - the slot props.
 * @returns {object} the page element.
 */
function TokenHeatmapSection(props) {
  const t = props.t ?? ((key) => key)
  const chinese = props.chinese === true
  const usage = useUsage()
  const tooltip = useTooltip()
  const [selected, setSelected] = React.useState(undefined)
  const [monthIndex, setMonthIndex] = React.useState(0)

  const summary = React.useMemo(() => summarize(usage.days, selected), [usage.days, selected])
  const today = React.useMemo(() => new Date(), [usage.updatedAt])
  const months = React.useMemo(() => monthList({ months: MONTHS, today }), [today])
  const thresholds = React.useMemo(() => {
    const totals = []
    for (const entry of summary.values.values()) {
      if (entry.total > 0) totals.push(entry.total)
    }
    return intensityThresholds(totals)
  }, [summary.values])

  if (usage.days.length === 0) {
    return h('section', { className: 'thm-page', 'aria-label': t('title') },
      h('style', null, HEATMAP_CSS),
      PlaceholderCard({ t, state: usage, onRefresh: () => void usage.load(true) }),
      TooltipBubble({ hover: tooltip.hover }))
  }

  return h('section', { className: 'thm-page', 'aria-label': t('title') },
    h('style', null, HEATMAP_CSS),
    h('div', { className: 'thm-head' },
      h('div', { className: 'thm-head-text' },
        h('div', { className: 'thm-title' }, t('title')),
        h('div', { className: 'thm-desc' }, t('description'))),
      h('button', {
        className: 'thm-btn',
        disabled: usage.status === 'loading',
        onClick: () => void usage.load(true),
      }, usage.status === 'loading' ? t('refreshing') : t('refresh'))),

    SummaryCard({ t, summary }),

    h('div', { className: 'thm-columns' },
      HeatmapCard({
        t,
        values: summary.values,
        thresholds,
        months,
        index: Math.min(monthIndex, months.length - 1),
        onIndex: setMonthIndex,
        chinese,
        tooltip,
      }),
      ModelCard({ t, models: summary.models, selected, onSelect: setSelected })),

    PlansCard({ t, plans: usage.plans ?? [], status: usage.status, plansReady: usage.plansReady }),

    h('div', { className: 'thm-note' },
      `${t('source')}${usage.updatedAt > 0 ? ` · ${t('updatedAt', { time: new Date(usage.updatedAt).toLocaleTimeString('zh-CN') })}` : ''}`),
    TooltipBubble({ hover: tooltip.hover }))
}


// ---- src/sidebar.js ----
/**
 * The sidebar card.
 *
 * It sits above the account row at the foot of the left column and shows
 * what today cost plus what is left of the plans the machine is connected
 * to. No grid here: the card is a readout, the heatmap lives in Settings.
 */







/**
 * One window of the shown plan: its name, what is left of it and its bar.
 *
 * @param {object} props - the window props.
 * @param {object} props.planWindow - the window the row shows.
 * @param {function} props.t - the translate function.
 * @returns {object} the window element.
 */
function SideWindowRow(props) {
  const { planWindow, t } = props
  const resets = resetTime(planWindow.resetsAt)
  const span = spanText(remainingSpan(planWindow.resetsAt), t)
  const note = span === '' ? (resets === '' ? null : t('resetsAt', { time: resets })) : t('resetsIn', { span, time: resets })
  return h('div', { className: 'thm-window', title: resets === '' ? undefined : t('resetsAt', { time: resets }) },
    h('div', { className: 'thm-window-head' },
      h('span', { className: 'thm-window-name' }, planWindow.name),
      h('span', { className: 'thm-window-value' }, t('windowRemaining', { percent: Math.round(planWindow.remaining) }))),
    h('div', { className: 'thm-window-bar' }, h('i', { style: { width: `${Math.round(planWindow.used)}%` } })),
    note === null ? null : h('div', { className: 'thm-plan-note' }, note))
}

/**
 * The plan panel: the plan switcher and the windows of the shown plan.
 *
 * @param {object} props - the panel props.
 * @param {object[]} props.plans - the connected plans.
 * @param {string} props.status - the read status of the usage.
 * @param {boolean} props.plansReady - whether the Host already looked.
 * @param {function} props.t - the translate function.
 * @returns {object} the panel element.
 */
function PlanPanel(props) {
  const { plans, selected, onSelect, status, plansReady, t } = props
  const [open, setOpen] = React.useState(false)
  const plan = plans.find(entry => entry.id === selected) ?? plans[0]
  if (plan === undefined) {
    return h('div', { className: 'thm-plan-note' }, planNote(status, t, plansReady))
  }
  const options = h('div', { className: 'thm-plan-menu' },
    plans.map(entry => h('button', {
      key: entry.id,
      type: 'button',
      className: `thm-plan-option${entry.id === plan.id ? ' is-active' : ''}`,
      onClick: () => { onSelect(entry.id); setOpen(false) },
    }, entry.label)))
  return h('div', { className: 'thm-plans' },
    h('div', { className: 'thm-plan-select' },
      h('button', {
        type: 'button',
        className: 'thm-plan-toggle',
        'aria-expanded': open,
        onClick: () => setOpen(!open),
      },
      h('span', { className: 'thm-plan-name' }, plan.label),
      h('span', { className: 'thm-plan-caret' }, open ? '▴' : '▾')),
      open ? options : null),
    plan.windows.map(planWindow => SideWindowRow({ planWindow, t })))
}

/**
 * The sidebar card component.
 *
 * @param {object} props - the slot props.
 * @returns {object | null} the card element.
 */
function SidebarHeatmap(props) {
  const t = props.t ?? ((key) => key)
  const wide = props.wide !== false
  const usage = useUsage(60_000)
  const [selected, setSelected] = React.useState(undefined)

  const summary = React.useMemo(() => summarize(usage.days, undefined), [usage.days])
  const today = React.useMemo(() => new Date(), [usage.updatedAt])

  if (!wide) return null

  const todayEntry = summary.values.get(formatDay(today))
  const todayTotal = todayEntry ? todayEntry.total : 0
  const plans = usage.plans ?? []
  // The first read is still on its way; the card waits instead of claiming
  // that nothing was spent today.
  const todayValue = usage.status === 'loading' ? '…' : formatTokens(todayTotal)

  return h('div', { className: 'thm-foot' },
    h('style', null, HEATMAP_CSS),
    h('div', { className: 'thm-foot-head' },
      h('span', { className: 'thm-foot-label' }, t('todayLabel')),
      h('span', { className: 'thm-foot-value' }, todayValue)),
    PlanPanel({ plans, selected, onSelect: setSelected, status: usage.status, plansReady: usage.plansReady, t }))
}


// ---- src/index.js ----
/**
 * Client half of the token-heatmap plugin.
 *
 * It contributes two surfaces:
 *  - one settings page: the daily token consumption of every model, laid out
 *    as a month-by-month heatmap;
 *  - one sidebar card above the account row: what today cost.
 */





/** Dictionary namespace owned by this plugin. */
const NS = 'settings.token-heatmap'

/**
 * Client plugin body.
 *
 * @param {object} ctx - the Client plugin context.
 */
function apply(ctx) {
  const localeService = ctx.get('locale') ?? ctx.locale
  const slots = ctx.get('slots') ?? ctx.slots

  if (localeService !== undefined) {
    ctx.effect(() => localeService.register(NS, { zh, en }), 'token-heatmap: dictionaries')
  }

  const activeLocale = () => {
    const snapshot = localeService?.getSnapshot?.() ?? localeService?.getLocale?.()
    return snapshot?.active
  }

  /**
   * The copy and the labels of the active locale.
   *
   * @param {object} props - the slot props.
   * @returns {object} the surface props with the locale's copy.
   */
  function withLocale(props) {
    const [locale, setLocale] = React.useState(activeLocale())
    React.useEffect(() => {
      if (localeService === undefined || typeof localeService.subscribe !== 'function') return undefined
      return localeService.subscribe(() => setLocale(activeLocale()))
    }, [])
    const chinese = isChinese(locale)
    const t = React.useMemo(() => bindTranslator(locale), [locale])
    return {
      ...props,
      t,
      chinese,
      weekdays: chinese ? WEEKDAYS.zh : WEEKDAYS.en,
      monthNames: chinese ? MONTH_NAMES.zh : MONTH_NAMES.en,
    }
  }

  /**
   * The settings page with the active locale's copy.
   *
   * @param {object} props - the slot props.
   * @returns {object} the page element.
   */
  function LocalizedSection(props) {
    return h(TokenHeatmapSection, withLocale(props))
  }

  /**
   * The sidebar card with the active locale's copy.
   *
   * @param {object} props - the slot props.
   * @returns {object} the card element.
   */
  function LocalizedCard(props) {
    return h(SidebarHeatmap, withLocale(props))
  }

  if (slots === undefined) return

  slots.inject('settings.section', () => slots.register({
    name: 'settings.section',
    id: 'token-heatmap',
    order: 20,
    label: () => bindTranslator(activeLocale())('title'),
    locale: NS,
  }, LocalizedSection))

  slots.inject('sidebar.footer.action', () => slots.register({
    name: 'sidebar.footer.action',
    id: 'token-heatmap',
    order: 0,
    label: () => bindTranslator(activeLocale())('todayLabel'),
    locale: NS,
  }, LocalizedCard))
}


    return { inject: ['slots', 'locale'], apply }
  },
})

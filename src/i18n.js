/**
 * Copy for the token heatmap page.
 *
 * The plugin owns one locale namespace; the page never shows a raw key. The
 * dictionaries carry strings only — the weekday and month labels live beside
 * them, because a locale dictionary holds text, not lists.
 */

/** Simplified Chinese dictionary. */
export const zh = {
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
  'planRows': '{n} 个套餐',
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
export const en = {
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
  'planRows': '{n} plans',
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
export const WEEKDAYS = {
  zh: ['一', '二', '三', '四', '五', '六', '日'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}

/** Month labels. */
export const MONTH_NAMES = {
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

/**
 * Whether a locale id names Chinese.
 *
 * @param {string | undefined} locale - the host's active locale id.
 * @returns {boolean} true for a Chinese locale.
 */
export function isChinese(locale) {
  return typeof locale === 'string' && locale.toLowerCase().startsWith('zh')
}

/**
 * Bind a locale id to the dictionary pair.
 *
 * @param {string | undefined} locale - the host's active locale id.
 * @returns {function} a translate function with `{name}` interpolation.
 */
export function bindTranslator(locale) {
  const dict = isChinese(locale) ? zh : en
  return (key, values) => {
    const template = dict[key] ?? en[key] ?? key
    if (values === undefined) return template
    return template.replace(/\{(\w+)\}/g, (match, name) => (
      values[name] === undefined ? match : String(values[name])
    ))
  }
}

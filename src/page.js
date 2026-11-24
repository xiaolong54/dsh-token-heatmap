/**
 * The token heatmap page.
 *
 * One settings page shows what the machine spent on models: the totals, a
 * month-by-month heatmap of the daily consumption, and the per-model
 * breakdown. Picking a model narrows the heatmap to that model.
 */

import { HEATMAP_CSS } from './styles.js'
import { intensityLevel, intensityThresholds, monthBlock, monthList, monthTotals, summarize } from './heatmap.js'
import { cacheHitRate, formatCount, formatTokens } from './format.js'
import { MONTH_NAMES, WEEKDAYS } from './i18n.js'
import { PlansCard } from './plans.js'
import { useUsage } from './usage.js'
import { TooltipBubble, useTooltip } from './tooltip.js'

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

  return h('div', { className: 'thm-card thm-heatmap-card' },
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

  return h('div', { className: 'thm-card thm-models-card' },
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
export function TokenHeatmapSection(props) {
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

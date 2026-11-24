/**
 * The sidebar card.
 *
 * It sits above the account row at the foot of the left column and shows
 * what today cost plus what is left of the plans the machine is connected
 * to. No grid here: the card is a readout, the heatmap lives in Settings.
 */

import { HEATMAP_CSS } from './styles.js'
import { formatDay, summarize } from './heatmap.js'
import { formatTokens, remainingSpan, resetTime, spanText } from './format.js'
import { useUsage } from './usage.js'

/**
 * One window of the shown plan: its name, what is left of it and its bar.
 *
 * @param {object} props - the window props.
 * @param {object} props.planWindow - the window the row shows.
 * @param {function} props.t - the translate function.
 * @returns {object} the window element.
 */
export function SideWindowRow(props) {
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
 * @returns {object} the panel element.
 */
function PlanPanel(props) {
  const { plans, selected, onSelect, t } = props
  const [open, setOpen] = React.useState(false)
  const plan = plans.find(entry => entry.id === selected) ?? plans[0]
  if (plan === undefined) {
    return h('div', { className: 'thm-plan-note' }, t('noPlans'))
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
export function SidebarHeatmap(props) {
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

  return h('div', { className: 'thm-foot' },
    h('style', null, HEATMAP_CSS),
    h('div', { className: 'thm-foot-head' },
      h('span', { className: 'thm-foot-label' }, t('todayLabel')),
      h('span', { className: 'thm-foot-value' }, formatTokens(todayTotal))),
    PlanPanel({ plans, selected, onSelect: setSelected, t }))
}

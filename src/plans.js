/**
 * The plan card.
 *
 * It lists every plan the machine is connected to, one block per plan, with
 * one bar per window. The sidebar card shows the plan the user picked; this
 * one shows them all at once.
 */

import { remainingSpan, resetTime, spanText } from './format.js'

/**
 * One window of one plan: its name, what is left of it and its bar.
 *
 * @param {object} props - the window props.
 * @param {object} props.planWindow - the window the row shows.
 * @param {function} props.t - the translate function.
 * @returns {object} the window element.
 */
export function PlanWindowRow(props) {
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
export function planNote(status, t, plansReady) {
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
export function PlansCard(props) {
  const { t, plans, status, plansReady } = props
  if (plans.length === 0) {
    return h('div', { className: 'thm-card thm-plans-card' },
      h('div', { className: 'thm-card-head' }, h('span', { className: 'thm-card-title' }, t('plans'))),
      h('div', { className: 'thm-empty' }, planNote(status, t, plansReady)))
  }
  return h('div', { className: 'thm-card thm-plans-card' },
    h('div', { className: 'thm-card-head' },
      h('span', { className: 'thm-card-title' }, t('plans')),
      h('span', { className: 'thm-card-note' }, t('planRows', { n: plans.length }))),
    h('div', { className: 'thm-plan-list' },
      plans.map(plan => h('div', { key: plan.id, className: 'thm-plan-block' },
        h('div', { className: 'thm-plan-block-name', title: plan.label }, plan.label),
        plan.windows.map(planWindow => PlanWindowRow({ planWindow, t }))))))
}

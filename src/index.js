/**
 * Client half of the token-heatmap plugin.
 *
 * It contributes two surfaces:
 *  - one settings page: the daily token consumption of every model, laid out
 *    as a month-by-month heatmap;
 *  - one sidebar card above the account row: what today cost.
 */

import { zh, en, bindTranslator, isChinese, WEEKDAYS, MONTH_NAMES } from './i18n.js'
import { TokenHeatmapSection } from './page.js'
import { SidebarHeatmap } from './sidebar.js'

/** Dictionary namespace owned by this plugin. */
const NS = 'settings.token-heatmap'

/**
 * Client plugin body.
 *
 * @param {object} ctx - the Client plugin context.
 */
export function apply(ctx) {
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

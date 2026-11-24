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
export function useTooltip() {
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
 * The bubble turns to the other side of the pointer when it would run out of
 * the window, so the last column of the grid can be read as well.
 *
 * @param {object} props - the bubble props.
 * @param {object | null} props.hover - the hovered cell, if any.
 * @returns {object | null} the bubble element.
 */
export function TooltipBubble({ hover }) {
  if (hover === null || hover === undefined) return null
  const width = Number.isFinite(globalThis.window?.innerWidth) ? globalThis.window.innerWidth : 1024
  const height = Number.isFinite(globalThis.window?.innerHeight) ? globalThis.window.innerHeight : 768
  const flip = hover.x > width - 240
  const style = {
    left: `${hover.x + (flip ? -14 : 14)}px`,
    top: `${Math.min(Math.max(hover.y + 14, 8), Math.max(8, height - 40))}px`,
  }
  if (flip) style.transform = 'translateX(-100%)'
  return h('div', { className: 'thm-tip', style }, hover.content)
}

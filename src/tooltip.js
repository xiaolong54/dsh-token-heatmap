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
 * @param {object} props - the bubble props.
 * @param {object | null} props.hover - the hovered cell, if any.
 * @returns {object | null} the bubble element.
 */
export function TooltipBubble({ hover }) {
  if (hover === null || hover === undefined) return null
  return h('div', {
    className: 'thm-tip',
    style: { left: `${hover.x + 14}px`, top: `${hover.y + 14}px` },
  }, hover.content)
}

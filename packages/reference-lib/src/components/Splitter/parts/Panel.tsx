/**
 * Splitter.Panel: one resizable region. It pins a stable registration key
 * on first render, registers its constraints with the nearest root from a
 * layout effect, and sizes itself from its own variable — the kernel's
 * flex declaration wins over consumer style, and pointer sessions rewrite
 * the same variable through the element ref between controlled commits.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { layoutNumbersEqual } from '../math/splitter-math'
import { SplitterContext } from '../context'
import type { SplitterPanelProps } from '../types'
import { PANEL_FLEX, PANEL_SIZE_VAR } from '../shared/geometry'
import { useComposedRef, useIsomorphicLayoutEffect } from '../shared/refs'

export const SplitterPanel = React.forwardRef<HTMLDivElement, SplitterPanelProps>(function SplitterPanel(
  {
    children,
    min,
    max,
    id: idProp,
    collapsible = false,
    collapsedSize = 0,
    className,
    style,
    ...props
  }: SplitterPanelProps,
  forwardedRef
) {
  // The deleted `index` prop is stripped so stale call sites
  // can't leak it to the DOM.
  const { index: _index, ...rest } = props as typeof props & { index?: unknown }
  void _index
  const context = React.useContext(SplitterContext)
  const orientation = context?.orientation ?? 'horizontal'

  // Pin the first render's id: the React 17 CT shim mints a fresh useId
  // per render, and DOM-order registration keys off this value.
  const autoId = React.useId().replace(/:/g, '')
  const [stableAutoId] = React.useState(autoId)
  const panelId = idProp ?? `splitter-panel-${stableAutoId}`
  const panelIndex = context?.getPanelIndex(stableAutoId) ?? -1
  const size = panelIndex >= 0 ? (context?.value[panelIndex] ?? 50) : 50

  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const composedPanelRef = useComposedRef(panelRef, forwardedRef)
  const registerPanel = context?.registerPanel
  useIsomorphicLayoutEffect(() => {
    if (!registerPanel) return
    return registerPanel({
      key: stableAutoId,
      id: panelId,
      element: panelRef.current,
      min,
      max,
      collapsible,
      collapsedSize,
    })
  }, [registerPanel, stableAutoId, panelId, min, max, collapsible, collapsedSize])

  const isCollapsed = collapsible && layoutNumbersEqual(size, collapsedSize)

  // FEATURES #4: the kernel owns flex on the layout axis, so the owned
  // declarations come after consumer style. Pointer sessions rewrite the
  // same variable through the element ref; React only rewrites it when the
  // controlled value actually changes.
  const geometryStyle = {
    ...style,
    flex: PANEL_FLEX,
    [PANEL_SIZE_VAR]: `${size}%`,
  } as React.CSSProperties

  return (
    <Div
      ref={composedPanelRef}
      id={panelId}
      data-reference-splitter-panel=""
      data-orientation={orientation}
      data-collapsed={isCollapsed ? '' : undefined}
      data-resizing={context?.isResizing ? '' : undefined}
      minWidth={orientation === 'horizontal' ? 0 : undefined}
      minHeight={orientation === 'vertical' ? 0 : undefined}
      overflow="auto"
      className={className}
      style={geometryStyle}
      {...rest}
    >
      {children}
    </Div>
  )
})

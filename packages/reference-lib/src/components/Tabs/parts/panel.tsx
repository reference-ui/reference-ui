/**
 * Tabs.Panel: the panel half of one Tab/Panel pair. Takes the panel
 * value plus a keepMounted opt-in (OR-ed with the root switch), shows
 * itself exactly when selected, and records the focus trail rescue
 * follows when a hiding selection strands focus. Kept-alive inactive
 * panels sit under native hidden, out of tab order and the a11y tree.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { TabsContext } from '../context'
import { useIsomorphicLayoutEffect } from '../shared/layout-effect'
import type { TabPanelProps } from '../types'

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  function TabPanel(
    {
      value,
      children,
      keepMounted: keepMountedProp = false,
      id: idProp,
      onFocus,
      className,
      style,
      ...props
    }: TabPanelProps,
    forwardedRef
  ) {
    // Managed-wins (TB-DOM-09): panel state is kernel-owned (Record
    // cast: see TabsList).
    const { 'data-state': _dropDataState, ...panelProps } =
      props as typeof props & Record<string, unknown>
    void _dropDataState
    const context = React.useContext(TabsContext)
    const isSelected = context ? context.value === value : false
    // Root keepMounted ORs with the per-panel opt-in: either switch
    // keeps this panel's children alive. Inactive kept panels sit under
    // native `hidden` (display:none drops them from tab order and the
    // accessibility tree, so no aria-hidden/inert is needed).
    const keepMounted = keepMountedProp || (context?.keepMounted ?? false)
    // Explicit Tab IDs flow in through the registry (TB-DOM-06); the
    // generated fallback keeps SSR and first render unchanged.
    const tabId = context
      ? (context.getTabId(value) ?? `${context.baseId}-tab-${value}`)
      : undefined
    const panelId = idProp ?? (context ? `${context.baseId}-panel-${value}` : undefined)
    // Dangling-linkage guard (TB-DOM-13): mirrors the Tab side — a Panel
    // with no registered Tab omits aria-labelledby on settled client
    // commits instead of pointing at a missing element.
    const tabLinked = !(context?.linkageSettled ?? false) || (context?.hasTab(value) ?? true)

    const claimPanelValue = context?.claimPanelValue
    React.useEffect(() => {
      if (!claimPanelValue) return
      return claimPanelValue(value)
    }, [claimPanelValue, value])

    // Identity registry entry (TB-DOM-06): same subscribe/unsubscribe shape
    // as Tab, so the Tab's aria-controls tracks explicit Panel IDs.
    const panelRef = React.useRef<HTMLDivElement>(null)
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        panelRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [forwardedRef]
    )
    const registerPanel = context?.registerPanel
    useIsomorphicLayoutEffect(() => {
      if (!registerPanel || panelId === undefined) return
      return registerPanel(value, { id: panelId, element: panelRef.current })
    }, [registerPanel, value, panelId])

    const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(e)
      // Focus entered this panel's subtree (FEATURES #4): record the trail
      // so a hiding selection change can rescue it. React normalizes focus
      // to bubble through the tree, so descendant (even portalled) focus
      // lands here. Consumer-first.
      context?.notePanelFocus(value)
    }

    return (
      <Div
        role="tabpanel"
        ref={setRefs}
        id={panelId}
        aria-labelledby={tabLinked ? tabId : undefined}
        hidden={!isSelected}
        onFocus={handleFocus}
        data-state={isSelected ? 'active' : 'inactive'}
        data-value={value}
        py="5r"
        px="0"
        color="design.text.base"
        className={className}
        style={style}
        {...panelProps}
      >
        {(isSelected || keepMounted) && children}
      </Div>
    )
  }
)

TabPanel.displayName = 'Tabs.Panel'

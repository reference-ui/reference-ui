import * as React from 'react'
import { Button, Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'

export type TabsOrientation = 'horizontal' | 'vertical'
export type TabsActivation = 'automatic' | 'manual'
export type TabsVariant = 'line' | 'pill'

export interface TabsProps {
  children?: React.ReactNode
  /** Controlled value. Omitted = uncontrolled (self-managed from defaultValue). */
  value?: string
  /** Uncontrolled initial value. Ignored once controlled. */
  defaultValue?: string | null
  onChange?: (value: string) => void
  orientation?: TabsOrientation
  activation?: TabsActivation
  variant?: TabsVariant
}

interface TabsTabEntry {
  id: string
  element: HTMLElement | null
  disabled: boolean
}

interface TabsPanelEntry {
  id: string
  element: HTMLElement | null
}

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
  orientation: TabsOrientation
  activation: TabsActivation
  variant: TabsVariant
  baseId: string
  rovingValue: string
  setRovingValue: (value: string) => void
  claimTabValue: (tabValue: string) => () => void
  claimPanelValue: (panelValue: string) => () => void
  registerTab: (tabValue: string, entry: TabsTabEntry) => () => void
  registerPanel: (panelValue: string, entry: TabsPanelEntry) => () => void
  getTabId: (tabValue: string) => string | undefined
  getPanelId: (panelValue: string) => string | undefined
  notePanelFocus: (panelValue: string) => void
  noteTabFocus: (tabValue: string) => void
}

// Layout before paint in the browser (atomic ARIA linkage, TB-DOM-06),
// plain effect on the server where layout effects warn and never run.
const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

// Shadow-aware focus lookup (TB-ENV-03): document.activeElement stops at
// the shadow host, so start from the list's own root and descend through
// open shadow roots. In light DOM this is document.activeElement.
function getDeepActiveElement(scope: Element): Element | null {
  let active: Element | null = (scope.getRootNode() as Document | ShadowRoot)
    .activeElement
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({
  children,
  value: valueProp,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  activation = 'automatic',
  variant = 'line',
}: TabsProps) {
  // Dual-mode selection (HQ EOD 2026-09-26 reversal of FEATURES #1):
  // value !== undefined → controlled; else self-managed from
  // defaultValue (Accordion shape: isControlled + internalValue
  // precedent). A null/missing default normalizes to '' so no tab
  // matches and nothing is selected; the roving repair still parks
  // the stop on first-enabled.
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<string>(
    () => defaultValue ?? ''
  )
  const value = isControlled ? valueProp : internalValue

  // Stable SSR-safe identity (TB-DOM-07, TB-ENV-01): useId keeps
  // server/client markup identical, unlike a module counter. Pinned in
  // state so registry effects settle even where useId is shimmed
  // per-render (CT React 17): a churning baseId would resubscribe every
  // render and the version bump would loop forever.
  const reactId = React.useId()
  const [baseId] = React.useState(() => `tabs-${reactId.replace(/:/g, '')}`)

  // Roving tab stop (TB-DOM-03, TB-MANUAL-01): follows focus so manual
  // arrows can leave the selected tab; selection changes re-sync it.
  const [rovingValue, setRovingValueState] = React.useState(value)
  const setRovingValue = React.useCallback((next: string) => {
    setRovingValueState(next)
  }, [])

  // Duplicate tracking (TB-DOM-10): value identity is claimed in an
  // effect with cleanup, so StrictMode double-render/double-effects and
  // dynamic add/remove never false-positive. Render-phase claiming
  // breaks under React 17/18 double-render (hook state resets between
  // the two invocations); commit-phase claiming is version-robust.
  const tabValueCounts = React.useRef<Map<string, number>>(new Map())
  const panelValueCounts = React.useRef<Map<string, number>>(new Map())
  const claimTabValue = React.useCallback((tabValue: string) => {
    const counts = tabValueCounts.current
    const next = (counts.get(tabValue) ?? 0) + 1
    counts.set(tabValue, next)
    if (next > 1) {
      throw new Error(
        `Reference UI: Tabs contains duplicate Tab value "${tabValue}". Every Tab must have a unique value.`
      )
    }
    return () => {
      const left = (counts.get(tabValue) ?? 1) - 1
      if (left <= 0) counts.delete(tabValue)
      else counts.set(tabValue, left)
    }
  }, [])
  const claimPanelValue = React.useCallback((panelValue: string) => {
    const counts = panelValueCounts.current
    const next = (counts.get(panelValue) ?? 0) + 1
    counts.set(panelValue, next)
    if (next > 1) {
      throw new Error(
        `Reference UI: Tabs contains duplicate Panel value "${panelValue}". Every Panel must have a unique value.`
      )
    }
    return () => {
      const left = (counts.get(panelValue) ?? 1) - 1
      if (left <= 0) counts.delete(panelValue)
      else counts.set(panelValue, left)
    }
  }, [])

  // Identity registry (TB-DOM-06, TB-DYNAMIC-01/02): value-keyed Tab and
  // Panel entries subscribed in a layout effect with cleanup, so explicit
  // IDs flow to the other side's ARIA reference and insert/reorder/remove
  // keep surviving IDs stable. The version bump re-renders consumers that
  // read through getTabId/getPanelId; the generated-ID fallback keeps SSR
  // and first render identical to the unregistered state.
  const tabEntries = React.useRef<Map<string, TabsTabEntry>>(new Map())
  const panelEntries = React.useRef<Map<string, TabsPanelEntry>>(new Map())
  const [registryVersion, setRegistryVersion] = React.useState(0)
  const registerTab = React.useCallback(
    (tabValue: string, entry: TabsTabEntry) => {
      tabEntries.current.set(tabValue, entry)
      setRegistryVersion(version => version + 1)
      return () => {
        if (tabEntries.current.get(tabValue) === entry) {
          tabEntries.current.delete(tabValue)
        }
        setRegistryVersion(version => version + 1)
      }
    },
    []
  )
  const registerPanel = React.useCallback(
    (panelValue: string, entry: TabsPanelEntry) => {
      panelEntries.current.set(panelValue, entry)
      setRegistryVersion(version => version + 1)
      return () => {
        if (panelEntries.current.get(panelValue) === entry) {
          panelEntries.current.delete(panelValue)
        }
        setRegistryVersion(version => version + 1)
      }
    },
    []
  )
  const getTabId = React.useCallback(
    (tabValue: string) => tabEntries.current.get(tabValue)?.id,
    []
  )
  const getPanelId = React.useCallback(
    (panelValue: string) => panelEntries.current.get(panelValue)?.id,
    []
  )

  // DOM-ordered enabled tabs (FEATURES #8, #4, #6): registry insertion
  // order goes stale across reorders (TB-DYNAMIC-01), so enabled entries
  // sort by document position. Detached entries are excluded; entries
  // without a measured element keep their relative order.
  const getOrderedEnabledTabs = React.useCallback((): string[] => {
    return Array.from(tabEntries.current.entries())
      .filter(([, entry]) => {
        if (entry.disabled) return false
        const el = entry.element
        if (el && !el.isConnected) return false
        return true
      })
      .sort(([, a], [, b]) => {
        const elA = a.element
        const elB = b.element
        if (!elA || !elB || elA === elB) return 0
        const pos = elA.compareDocumentPosition(elB)
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
        return 0
      })
      .map(([tabValue]) => tabValue)
  }, [])

  // DOM-ordered connected tabs (FEATURES #4, #6): the full list that
  // nearest-enabled fallback walks; disabled entries included so distance
  // is measured in tab order, not enabled order.
  const getOrderedTabs = React.useCallback((): string[] => {
    return Array.from(tabEntries.current.entries())
      .filter(([, entry]) => {
        const el = entry.element
        if (el && !el.isConnected) return false
        return true
      })
      .sort(([, a], [, b]) => {
        const elA = a.element
        const elB = b.element
        if (!elA || !elB || elA === elB) return 0
        const pos = elA.compareDocumentPosition(elB)
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
        return 0
      })
      .map(([tabValue]) => tabValue)
  }, [])

  // Nearest enabled tab to a value in tab order; ties go to the
  // preceding tab (TESTS tie-break, FEATURES #6). Unknown values fall
  // back to first-enabled. An explicit order override lets removals walk
  // the pre-removal positions (the removed value is already gone from
  // the live registry when the handoff effect runs).
  const nearestEnabledTab = React.useCallback(
    (fromValue: string, allOverride?: string[]): string | undefined => {
      const enabled = getOrderedEnabledTabs()
      if (enabled.includes(fromValue)) return fromValue
      const all = allOverride ?? getOrderedTabs()
      const idx = all.indexOf(fromValue)
      for (let d = 1; d <= all.length; d++) {
        const prev = idx === -1 ? undefined : all[idx - d]
        if (prev !== undefined && enabled.includes(prev)) return prev
        const next = idx === -1 ? undefined : all[idx + d]
        if (next !== undefined && enabled.includes(next)) return next
      }
      return enabled[0]
    },
    [getOrderedEnabledTabs, getOrderedTabs]
  )

  // Last panel to hold focus (FEATURES #4): set on focus-enter, never
  // cleared on blur — removal drops focus synchronously during commit, so
  // a blur-clear would erase the trail before the rescue effect reads it.
  // Stale values are safe: rescue also requires focus to be inside that
  // hidden panel or lost to the root, so focus on a tab or an external
  // control never rescues.
  const focusedPanelRef = React.useRef<string | null>(null)
  const notePanelFocus = React.useCallback((panelValue: string) => {
    focusedPanelRef.current = panelValue
  }, [])

  // Focus rescue (TB-SELECT-07, FEATURES #4): a programmatic selection
  // change that hides the focused panel moves focus to the newly selected
  // Tab — or the nearest enabled fallback when that tab is disabled —
  // with no onChange. Fires when focus is still inside the hidden panel
  // (keepMounted, display:none drop pending) or was lost to the root by
  // the unmounting children. Focus anywhere else (a tab, an external
  // control) is left untouched — never stolen.
  useIsomorphicLayoutEffect(() => {
    const lastPanel = focusedPanelRef.current
    if (lastPanel === null || lastPanel === value) return
    let scope: Element | null = null
    for (const entry of tabEntries.current.values()) {
      if (entry.element) {
        scope = entry.element
        break
      }
    }
    if (!scope && typeof document !== 'undefined') scope = document.documentElement
    if (!scope) return
    const active = getDeepActiveElement(scope)
    const panelEl = panelEntries.current.get(lastPanel)?.element
    const insideHidden =
      active instanceof HTMLElement && !!panelEl?.contains(active)
    const ownerDoc =
      scope.ownerDocument ?? (typeof document !== 'undefined' ? document : null)
    const lost = !active || (ownerDoc !== null && active === ownerDoc.body)
    if (!insideHidden && !lost) return
    focusedPanelRef.current = null
    const target = nearestEnabledTab(value)
    if (target === undefined) return
    const targetEl = tabEntries.current.get(target)?.element
    if (targetEl && targetEl.isConnected) {
      setRovingValueState(target)
      targetEl.focus()
    }
  }, [value, nearestEnabledTab])

  // Selection re-syncs the stop (TB-SELECT-03); a disabled or unmatched
  // selection falls back to the first enabled tab (FEATURES #8). With no
  // enabled tab the stop stays on the value, which no enabled tab
  // matches, so zero tabIndex=0 is exposed (TB-DOM-11). Registry churn
  // repairs only a broken stop — never snaps a focus-moved stop back to
  // the selection (TB-MANUAL-01, TB-AUTO-05). Selection is untouched and
  // no onChange fires on either path.
  const prevValueRef = React.useRef(value)
  React.useEffect(() => {
    const ordered = getOrderedEnabledTabs()
    if (value !== prevValueRef.current) {
      prevValueRef.current = value
      setRovingValueState(ordered.includes(value) ? value : (ordered[0] ?? value))
    } else if (!ordered.includes(rovingValue)) {
      const first = ordered[0]
      if (first !== undefined) setRovingValueState(first)
    }
  }, [value, registryVersion, rovingValue, getOrderedEnabledTabs])

  // Focused tab trail (FEATURES #6): the tab holding DOM focus, for the
  // disable/remove handoff. Focusing a tab also clears the panel trail —
  // focus demonstrably left the panel subtree.
  const focusedTabRef = React.useRef<string | null>(null)
  const noteTabFocus = React.useCallback((tabValue: string) => {
    focusedTabRef.current = tabValue
    focusedPanelRef.current = null
  }, [])

  // Pre-change tab order (FEATURES #6): removals walk the positions from
  // before the removal commit, so nearest-enabled is measured from where
  // the focused tab stood, not from first-enabled.
  const prevTabOrderRef = React.useRef<string[]>([])

  // Disabled/removed-tab handoff (TB-DYNAMIC-03, FEATURES #6): when the
  // focused tab disables or unmounts, focus and the current stop move to
  // the nearest enabled tab (ties to preceding), while selection and the
  // visible panel stay unchanged and no request fires. Declared after the
  // #8 repair so the handoff target wins over first-enabled. Focus that
  // already moved elsewhere is never stolen.
  React.useEffect(() => {
    const currentOrder = getOrderedTabs()
    const walkOrder =
      prevTabOrderRef.current.length > 0
        ? prevTabOrderRef.current
        : currentOrder
    prevTabOrderRef.current = currentOrder
    const focused = focusedTabRef.current
    if (focused === null) return
    const entry = tabEntries.current.get(focused)
    const broken =
      !entry ||
      entry.disabled ||
      (entry.element !== null && !entry.element.isConnected)
    if (!broken) return
    let scope: Element | null = entry?.element ?? null
    if (!scope) {
      for (const candidate of tabEntries.current.values()) {
        if (candidate.element) {
          scope = candidate.element
          break
        }
      }
    }
    if (!scope && typeof document !== 'undefined') {
      scope = document.documentElement
    }
    if (!scope) return
    const active = getDeepActiveElement(scope)
    const ownerDoc =
      scope.ownerDocument ?? (typeof document !== 'undefined' ? document : null)
    const lost = !active || (ownerDoc !== null && active === ownerDoc.body)
    const onBroken = entry?.element != null && active === entry.element
    if (!lost && !onBroken) return
    const target = nearestEnabledTab(focused, walkOrder)
    if (target === undefined) return
    const targetEl = tabEntries.current.get(target)?.element
    if (targetEl && targetEl.isConnected) {
      focusedTabRef.current = target
      setRovingValueState(target)
      targetEl.focus()
    }
  }, [registryVersion, getOrderedTabs, nearestEnabledTab])

  const setValue = React.useCallback(
    (nextValue: string) => {
      // Redundant requests are suppressed (TB-SELECT-04, TB-MANUAL-04):
      // activating the selected tab is a no-op, not a transition.
      if (nextValue === value) return
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    },
    [isControlled, onChange, value]
  )

  const contextValue = React.useMemo<TabsContextValue>(
    () => ({
      value,
      setValue,
      orientation,
      activation,
      variant,
      baseId,
      rovingValue,
      setRovingValue,
      claimTabValue,
      claimPanelValue,
      registerTab,
      registerPanel,
      getTabId,
      getPanelId,
      notePanelFocus,
      noteTabFocus,
    }),
    [
      value,
      setValue,
      orientation,
      activation,
      variant,
      baseId,
      rovingValue,
      setRovingValue,
      claimTabValue,
      claimPanelValue,
      registerTab,
      registerPanel,
      getTabId,
      getPanelId,
      notePanelFocus,
      noteTabFocus,
      // Unread by the factory: bumps re-render ARIA-linkage readers.
      registryVersion,
    ]
  )

  return (
    <TabsContext.Provider value={contextValue}>
      {children}
    </TabsContext.Provider>
  )
}

export type TabsListProps = PrimitiveProps<'div'> & {
  variant?: TabsVariant
}

export function TabsList({
  children,
  variant: variantProp,
  className,
  style,
  onKeyDown,
  ...props
}: TabsListProps) {
  const context = React.useContext(TabsContext)
  const orientation = context?.orientation ?? 'horizontal'
  const variant = variantProp ?? context?.variant ?? 'line'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return

    // Scope to this list only (TB-NEST-01): nested instances' tabs live
    // inside this subtree but belong to their own tablist.
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    ).filter(
      tab =>
        !tab.disabled &&
        tab.closest('[role="tablist"]') === e.currentTarget
    )

    if (tabs.length === 0) return

    // Deep lookup (TB-ENV-03): document.activeElement returns the shadow
    // host inside a ShadowRoot, which would index -1 and kill the arrows.
    const activeIndex = tabs.indexOf(
      getDeepActiveElement(e.currentTarget) as HTMLButtonElement
    )
    if (activeIndex === -1) return

    // Read at event time (TB-AUTO-02, TB-AUTO-06): runtime dir flips apply
    // to the next keypress with no cached direction to go stale.
    const dirAncestor = e.currentTarget.closest('[dir]')
    const isRTL = dirAncestor?.getAttribute('dir') === 'rtl'

    let targetIndex = -1

    if (orientation === 'horizontal') {
      if (e.key === 'ArrowRight') {
        targetIndex = isRTL
          ? (activeIndex - 1 + tabs.length) % tabs.length
          : (activeIndex + 1) % tabs.length
      } else if (e.key === 'ArrowLeft') {
        targetIndex = isRTL
          ? (activeIndex + 1) % tabs.length
          : (activeIndex - 1 + tabs.length) % tabs.length
      }
    } else {
      if (e.key === 'ArrowDown') {
        targetIndex = (activeIndex + 1) % tabs.length
      } else if (e.key === 'ArrowUp') {
        targetIndex = (activeIndex - 1 + tabs.length) % tabs.length
      }
    }

    if (e.key === 'Home') {
      targetIndex = 0
    } else if (e.key === 'End') {
      targetIndex = tabs.length - 1
    }

    if (targetIndex !== -1) {
      e.preventDefault()
      const targetTab = tabs[targetIndex]
      targetTab?.focus()
      if (context?.activation === 'automatic') {
        const val = targetTab?.getAttribute('data-value')
        if (val) {
          context.setValue(val)
        }
      }
    }
  }

  // Variant chrome stays kernel-inline (FEATURES #1): the collector
  // only reliably harvests inline JSX literals on primitives — Book-side
  // recipe consts flip in/out across syncs (proven 2026-09-26) — so the
  // pill look has no other collectible home and `variant` stays.
  const isLine = variant === 'line'

  return (
    <Div
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      data-variant={variant}
      data-reference-tabs-list=""
      onKeyDown={handleKeyDown}
      display={isLine ? 'flex' : 'inline-flex'}
      flexDirection={orientation === 'vertical' ? 'column' : 'row'}
      gap={isLine ? (orientation === 'horizontal' ? '4r' : '1r') : '1r'}
      borderBottomWidth={isLine && orientation === 'horizontal' ? '1px' : undefined}
      borderBottomStyle={isLine && orientation === 'horizontal' ? 'solid' : undefined}
      borderBottomColor={isLine && orientation === 'horizontal' ? 'ui.table.border' : undefined}
      borderRightWidth={isLine && orientation === 'vertical' ? '1px' : undefined}
      borderRightStyle={isLine && orientation === 'vertical' ? 'solid' : undefined}
      borderRightColor={isLine && orientation === 'vertical' ? 'ui.table.border' : undefined}
      bg={isLine ? 'transparent' : 'ui.tab.track.background'}
      p={isLine ? '0' : '1r'}
      borderRadius={isLine ? undefined : 'md'}
      position="relative"
      className={className}
      style={{
        borderBottomColor: isLine && orientation === 'horizontal' ? 'var(--colors-ui-table-border)' : undefined,
        borderRightColor: isLine && orientation === 'vertical' ? 'var(--colors-ui-table-border)' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Div>
  )
}

export type TabProps = Omit<PrimitiveProps<'button'>, 'value'> & {
  value: string
  variant?: TabsVariant
}

export function Tab({
  value,
  children,
  variant: variantProp,
  disabled: disabledProp,
  onClick,
  onFocus,
  className,
  style,
  id: idProp,
  ...props
}: TabProps) {
  const context = React.useContext(TabsContext)
  const orientation = context?.orientation ?? 'horizontal'
  const variant = variantProp ?? context?.variant ?? 'line'
  const isSelected = context ? context.value === value : false
  const isDisabled = disabledProp ?? false
  const tabId = idProp ?? (context ? `${context.baseId}-tab-${value}` : undefined)
  // Explicit Panel IDs flow in through the registry (TB-DOM-06); the
  // generated fallback keeps SSR and first render unchanged.
  const panelId = context
    ? (context.getPanelId(value) ?? `${context.baseId}-panel-${value}`)
    : undefined

  // Duplicate identity is a hard error (TB-DOM-10): value is the public
  // Tab-to-Panel mapping, so a collision would fork ARIA linkage.
  // Claimed in an effect (commit phase), never during render.
  const claimTabValue = context?.claimTabValue
  React.useEffect(() => {
    if (!claimTabValue) return
    return claimTabValue(value)
  }, [claimTabValue, value])

  // Identity registry entry (TB-DOM-06, TB-DYNAMIC-01/02): layout effect
  // with cleanup, so the Panel's aria-labelledby updates before paint and
  // unmounts unsubscribe. Refs attach before layout effects, so the host
  // element is captured on the same commit.
  const tabRef = React.useRef<HTMLButtonElement>(null)
  const registerTab = context?.registerTab
  useIsomorphicLayoutEffect(() => {
    if (!registerTab || tabId === undefined) return
    return registerTab(value, {
      id: tabId,
      element: tabRef.current,
      disabled: isDisabled,
    })
  }, [registerTab, value, tabId, isDisabled])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && context) {
      context.setValue(value)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    onFocus?.(e)
    // The roving stop tracks focus (TB-MANUAL-01); disabled tabs stay
    // unreachable (TB-DOM-08, TB-DOM-11). Every tab focus (even a
    // disabled one, where the engine allows it) records the handoff
    // trail (FEATURES #6).
    if (!context) return
    context.noteTabFocus(value)
    if (!isDisabled) {
      context.setRovingValue(value)
    }
  }

  const isLine = variant === 'line'
  const isRovingStop =
    !!context && !isDisabled && context.rovingValue === value

  return (
    <Button
      type="button"
      role="tab"
      ref={tabRef}
      id={tabId}
      tabIndex={isRovingStop ? 0 : -1}
      aria-selected={isSelected}
      aria-controls={isSelected ? panelId : undefined}
      data-state={isSelected ? 'active' : 'inactive'}
      data-variant={variant}
      data-disabled={isDisabled ? '' : undefined}
      data-value={value}
      disabled={isDisabled}
      onClick={handleClick}
      onFocus={handleFocus}
      h={isLine ? 'auto' : undefined}
      px={isLine ? (orientation === 'vertical' ? '3r' : '2r') : '3r'}
      pt={isLine ? (orientation === 'horizontal' ? '2.5r' : '2r') : '1.5r'}
      pb={isLine ? (orientation === 'horizontal' ? '3.5r' : '2r') : '1.5r'}
      border="none"
      borderBottom={
        isLine && orientation === 'horizontal'
          ? isSelected
            ? '3px solid'
            : '3px solid transparent'
          : undefined
      }
      borderRight={
        isLine && orientation === 'vertical'
          ? isSelected
            ? '3px solid'
            : '3px solid transparent'
          : undefined
      }
      borderColor={isLine && isSelected ? 'ui.focus.ring' : 'transparent'}
      marginBottom={isLine && orientation === 'horizontal' ? '-1px' : undefined}
      marginRight={isLine && orientation === 'vertical' ? '-1px' : undefined}
      borderRadius={isLine ? '0' : 'sm'}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      bg={
        isLine
          ? 'transparent'
          : isSelected
          ? 'gray.200'
          : 'transparent'
      }
      color={
        isSelected
          ? isLine
            ? 'design.text.base'
            : 'ui.button.foreground'
          : 'design.text.light'
      }
      fontWeight="500"
      textShadow={isLine && isSelected ? '0 0 0.4px currentColor' : undefined}
      fontSize="3.5r"
      boxShadow={!isLine && isSelected ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'}
      opacity={isDisabled ? 0.5 : 1}
      transition="color 150ms ease, border-color 150ms ease, background-color 150ms ease"
      _hover={
        !isSelected && !isDisabled
          ? isLine
            ? { color: 'design.text.base', borderColor: 'ui.field.border' }
            : { color: 'design.text.base', bg: 'rgba(255,255,255,0.04)' }
          : undefined
      }
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'ui.focus.ring',
        outlineOffset: isLine ? '-2px' : '2px',
      }}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Button>
  )
}

export type TabPanelProps = Omit<PrimitiveProps<'div'>, 'value'> & {
  value: string
  keepMounted?: boolean
}

export function TabPanel({
  value,
  children,
  keepMounted = false,
  id: idProp,
  onFocus,
  className,
  style,
  ...props
}: TabPanelProps) {
  const context = React.useContext(TabsContext)
  const isSelected = context ? context.value === value : false
  // Explicit Tab IDs flow in through the registry (TB-DOM-06); the
  // generated fallback keeps SSR and first render unchanged.
  const tabId = context
    ? (context.getTabId(value) ?? `${context.baseId}-tab-${value}`)
    : undefined
  const panelId = idProp ?? (context ? `${context.baseId}-panel-${value}` : undefined)

  const claimPanelValue = context?.claimPanelValue
  React.useEffect(() => {
    if (!claimPanelValue) return
    return claimPanelValue(value)
  }, [claimPanelValue, value])

  // Identity registry entry (TB-DOM-06): same subscribe/unsubscribe shape
  // as Tab, so the Tab's aria-controls tracks explicit Panel IDs.
  const panelRef = React.useRef<HTMLDivElement>(null)
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
      ref={panelRef}
      id={panelId}
      aria-labelledby={tabId}
      hidden={!isSelected}
      onFocus={handleFocus}
      data-state={isSelected ? 'active' : 'inactive'}
      data-value={value}
      py="5r"
      px="0"
      color="design.text.base"
      className={className}
      style={style}
      {...props}
    >
      {(isSelected || keepMounted) && children}
    </Div>
  )
}

export const TabsTrigger = Tab
export const TabsContent = TabPanel

Tabs.List = TabsList
Tabs.Tab = Tab
Tabs.Trigger = Tab
Tabs.Panel = TabPanel
Tabs.Content = TabPanel

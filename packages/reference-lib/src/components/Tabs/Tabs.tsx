import * as React from 'react'
import { Button, Div, recipe, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { RovingFocus, useRovingFocusContext } from '../RovingFocus'

export type TabsOrientation = 'horizontal' | 'vertical'
export type TabsActivation = 'automatic' | 'manual'
export type TabsVariant = 'line' | 'pill'
/**
 * System-level variant (HQ system-variant mechanism): the prepackaged
 * `line`/`pill` names plus any author recipe name. Custom names typecheck
 * here and render through the author's own recipe classes; the kernel
 * recipes below resolve unknown names to base + axis classes with no
 * built-in paint. There is no variants prop and no theme registry — the
 * style system's `css()`/`recipe()` calls ARE the extension API.
 */
export type TabsVariantProp = TabsVariant | (string & {})

export interface TabsProps {
  children?: React.ReactNode
  /** Optional value. Omitted = uncontrolled (self-managed from the first tab). */
  value?: string
  /** Optional notification; fires on user-driven selection changes in both modes. */
  onChange?: (value: string) => void
  orientation?: TabsOrientation
  activation?: TabsActivation
  variant?: TabsVariantProp
  /**
   * Keep every panel mounted when inactive (W-15, Base UI parity).
   * Default false (current behavior: inactive panels unmount their
   * children). True keeps all children alive under native `hidden`.
   * OR-ed with the per-panel `keepMounted` on `TabPanel`.
   */
  keepMounted?: boolean
}

const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

function warnTabs(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`Reference UI: Tabs ${message}`)
}

// Prepackaged variant styles, authored as system recipes (HQ system-variant
// mechanism — the strip direction is closed, the kernel keeps line/pill).
// Axes hold axis-pure styles only; every cross-term (padding, indicator,
// selected color, idle hover) lives in a compound keyed on its variant, so
// unknown author names resolve to base + axis classes with no built-in
// paint. Overriding a built-in goes through the normal cascade: host style
// props / css() / the css prop compile to utilities, and the utilities
// layer follows the recipes layer. Verbatim values from the former inline
// props — the 22 CT snapshots pin them pixel-identical.
export const tabsListRecipe = recipe({
  className: 'tabsList',
  base: {
    position: 'relative',
  },
  variants: {
    variant: {
      line: { display: 'flex', bg: 'transparent', p: '0' },
      pill: {
        display: 'inline-flex',
        bg: 'ui.tab.track.background',
        p: '1r',
        borderRadius: 'md',
        gap: '1r',
      },
    },
    orientation: {
      horizontal: { flexDirection: 'row' },
      vertical: { flexDirection: 'column' },
    },
  },
  compoundVariants: [
    {
      variant: 'line',
      orientation: 'horizontal',
      css: {
        gap: '4r',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'ui.table.border',
      },
    },
    {
      variant: 'line',
      orientation: 'vertical',
      css: {
        gap: '1r',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderRightColor: 'ui.table.border',
      },
    },
  ],
})

export const tabsTabRecipe = recipe({
  className: 'tabsTab',
  base: {
    border: 'none',
    borderColor: 'transparent',
    bg: 'transparent',
    fontWeight: '500',
    fontSize: '3.5r',
    boxShadow: 'none',
    transition:
      'color 150ms ease, border-color 150ms ease, background-color 150ms ease',
    _focusVisible: {
      outline: '2px solid',
      outlineColor: 'ui.focus.ring',
    },
  },
  variants: {
    variant: {
      line: {
        h: 'auto',
        borderRadius: '0',
        _focusVisible: { outlineOffset: '-2px' },
      },
      pill: {
        px: '3r',
        pt: '1.5r',
        pb: '1.5r',
        borderRadius: 'sm',
        _focusVisible: { outlineOffset: '2px' },
      },
    },
    // No orientation-pure tab styles exist — every orientation effect
    // crosses with the variant — so these values stay empty and compounds
    // below carry the orientation predicates.
    orientation: {
      horizontal: {},
      vertical: {},
    },
    selected: {
      selected: {},
      unselected: { color: 'design.text.light' },
    },
    disabled: {
      disabled: { cursor: 'not-allowed', opacity: 0.5 },
      enabled: { cursor: 'pointer', opacity: 1 },
    },
  },
  compoundVariants: [
    // Line padding + overlap pull (orientation-crossed).
    {
      variant: 'line',
      orientation: 'horizontal',
      css: { px: '2r', pt: '2.5r', pb: '3.5r', marginBottom: '-1px' },
    },
    {
      variant: 'line',
      orientation: 'vertical',
      css: { px: '3r', pt: '2r', pb: '2r', marginRight: '-1px' },
    },
    // Line indicator (orientation × selection crossed).
    {
      variant: 'line',
      orientation: 'horizontal',
      selected: 'selected',
      css: { borderBottom: '3px solid' },
    },
    {
      variant: 'line',
      orientation: 'horizontal',
      selected: 'unselected',
      css: { borderBottom: '3px solid transparent' },
    },
    {
      variant: 'line',
      orientation: 'vertical',
      selected: 'selected',
      css: { borderRight: '3px solid' },
    },
    {
      variant: 'line',
      orientation: 'vertical',
      selected: 'unselected',
      css: { borderRight: '3px solid transparent' },
    },
    // Selected color/weight (variant-crossed).
    {
      variant: 'line',
      selected: 'selected',
      css: {
        borderColor: 'ui.focus.ring',
        color: 'design.text.base',
        textShadow: '0 0 0.4px currentColor',
      },
    },
    {
      variant: 'pill',
      selected: 'selected',
      css: {
        bg: 'gray.200',
        // B-08: bg is mode-STATIC light gray, so the text must be
        // mode-static dark. Mode-flipping tokens are wrong in exactly one
        // mode each: ui.button.foreground is white-on-gray.200 in light
        // mode (the filed bug); design.text.base would be white-on-gray.200
        // in dark mode. gray.950 reads on gray.200 in both modes.
        color: 'gray.950',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      },
    },
    // Idle hover (variant × unselected × enabled crossed).
    {
      variant: 'line',
      selected: 'unselected',
      disabled: 'enabled',
      css: {
        _hover: { color: 'design.text.base', borderColor: 'ui.field.border' },
      },
    },
    {
      variant: 'pill',
      selected: 'unselected',
      disabled: 'enabled',
      css: {
        _hover: { color: 'design.text.base', bg: 'rgba(255,255,255,0.04)' },
      },
    },
  ],
})

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
  variant: TabsVariantProp
  keepMounted: boolean
  baseId: string
  // Selection→currentness sync (kernel composition): the tab value that
  // should hold the kernel tab stop — the selected value when it names an
  // enabled tab, else first-enabled, else null (kernel settlement owns the
  // all-disabled zero-stop state). Consumed by TabsSelectionSync inside the
  // RovingFocus root; the kernel owns focus-following currentness.
  selectionSyncTarget: string | null
  // True once client layout effects have run (never in SSR): ARIA
  // references render from generated fallbacks until set, then omit when
  // the live registry lacks the counterpart (TB-ENV-01 vs TB-DOM-13).
  linkageSettled: boolean
  claimTabValue: (tabValue: string) => () => void
  claimPanelValue: (panelValue: string) => () => void
  registerTab: (tabValue: string, entry: TabsTabEntry) => () => void
  registerPanel: (panelValue: string, entry: TabsPanelEntry) => () => void
  registerList: () => () => void
  getTabId: (tabValue: string) => string | undefined
  getPanelId: (panelValue: string) => string | undefined
  hasTab: (tabValue: string) => boolean
  hasPanel: (panelValue: string) => boolean
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
  onChange,
  orientation = 'horizontal',
  activation = 'automatic',
  variant = 'line',
  keepMounted = false,
}: TabsProps) {
  // Optional value (HQ EOD 2026-09-26 optional-value exception to the
  // no-uncontrolled-seed stance, superseding the FEATURES #1 reversal):
  // value !== undefined → controlled; else self-managed from the
  // natural zero — the first enabled tab. There is no seeding API.
  // internalValue null = never seeded and never user-set; the seed
  // effect below pins it to first-enabled once tabs register.
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<string | null>(null)
  const value = isControlled ? valueProp : (internalValue ?? '')

  // Stable SSR-safe identity (TB-DOM-07, TB-ENV-01): useId keeps
  // server/client markup identical, unlike a module counter. Pinned in
  // state so registry effects settle even where useId is shimmed
  // per-render (CT React 17): a churning baseId would resubscribe every
  // render and the version bump would loop forever.
  const reactId = React.useId()
  const [baseId] = React.useState(() => `tabs-${reactId.replace(/:/g, '')}`)

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
  const hasTab = React.useCallback(
    (tabValue: string) => tabEntries.current.has(tabValue),
    []
  )
  const hasPanel = React.useCallback(
    (panelValue: string) => panelEntries.current.has(panelValue),
    []
  )

  // Linkage settlement (TB-ENV-01 vs TB-DOM-13): flips pre-paint on
  // the client (child registry subscriptions run first, so one re-render
  // carries both); never flips in SSR, where layout effects never run.
  const [linkageSettled, setLinkageSettled] = React.useState(false)
  useIsomorphicLayoutEffect(() => {
    setLinkageSettled(true)
  }, [])

  // Mounted List count (TB-DOM-13): exactly one List per Tabs; zero or
  // two-plus is a dev diagnostic, never a crash. The ref mirrors the
  // state synchronously: passive effects of the mount commit flush before
  // subscription setStates re-render, so the state still reads 0 when the
  // diagnostic first runs — the ref reads the settled value.
  const [listCount, setListCount] = React.useState(0)
  const listCountRef = React.useRef(0)
  const registerList = React.useCallback(() => {
    listCountRef.current += 1
    setListCount(count => count + 1)
    return () => {
      listCountRef.current = Math.max(0, listCountRef.current - 1)
      setListCount(count => Math.max(0, count - 1))
    }
  }, [])

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

  // Ordered enabled values for the selection sync, recomputed per
  // registry commit (identity-stable between bumps).
  const enabledTabValues = React.useMemo(
    () => getOrderedEnabledTabs(),
    [registryVersion, getOrderedEnabledTabs]
  )

  // Selection→currentness target (TB-SELECT-03, FEATURES #8): the
  // selected value when it names an enabled tab, else first-enabled, else
  // null. Applied by TabsSelectionSync inside the RovingFocus root; null
  // leaves the stop to kernel settlement (all-disabled → zero stops,
  // TB-DOM-11). Consumed on value/registry change only — manual
  // focus-diverged stops are never snapped back (TB-MANUAL-01).
  const selectionSyncTarget: string | null = enabledTabValues.includes(value)
    ? value
    : (enabledTabValues[0] ?? null)

  // Natural-zero seed (optional value): an uncontrolled Tabs with no
  // user selection yet starts on the first enabled tab. Seeding is a
  // mount repair, not a transition — no onChange fires. Retries across
  // registry bumps until a seed sticks; user selections (non-null
  // internalValue) are never reseeded.
  React.useEffect(() => {
    if (isControlled || internalValue !== null) return
    const first = getOrderedEnabledTabs()[0]
    if (first !== undefined) setInternalValue(first)
  }, [isControlled, internalValue, registryVersion, getOrderedEnabledTabs])

  // Unmatched controlled value (W-16, near-verbatim MUI precedent): a
  // typo'd controlled value renders a silently blank panel, so dev names
  // the component, the bad value, and the registered values. Uncontrolled
  // mode never warns (seed and transitions always come from registered
  // tabs), and neither does an empty registry — async tabs that resolve
  // must never false-positive on first render.
  React.useEffect(() => {
    if (!isControlled) return
    const registered = Array.from(tabEntries.current.keys())
    if (registered.length === 0) return
    if (!registered.includes(value)) {
      warnTabs(
        `value "${value}" matches no Tab (registered values: ${registered.join(', ')}).`
      )
    }
  }, [isControlled, value, registryVersion])

  // Structural diagnostics (TB-DOM-13): one List and one Tab/Panel pair
  // per value, verified per commit in dev. An empty tree stays silent
  // (async anatomy resolving must never false-positive); anything
  // mounted but unpaired names the exact mismatch. Dangling ARIA is
  // prevented at render (Tab/Panel omit the reference when the live
  // registry lacks the counterpart on the client).
  React.useEffect(() => {
    if (globalProcess?.env?.NODE_ENV === 'production') return
    const tabs = Array.from(tabEntries.current.keys())
    const panels = Array.from(panelEntries.current.keys())
    if (tabs.length === 0 && panels.length === 0) return
    const liveListCount = listCountRef.current
    if (liveListCount === 0) {
      warnTabs(
        'renders Tab/Panel parts with no Tabs.List. Render exactly one Tabs.List so keyboard movement and the tab stop exist.'
      )
    } else if (liveListCount > 1) {
      warnTabs(
        `renders ${liveListCount} Tabs.List parts. Render exactly one List per Tabs.`
      )
    }
    const panelSet = new Set(panels)
    for (const tabValue of tabs) {
      if (!panelSet.has(tabValue)) {
        warnTabs(
          `Tab value "${tabValue}" has no matching Panel. Render one Panel per Tab value.`
        )
      }
    }
    const tabSet = new Set(tabs)
    for (const panelValue of panels) {
      if (!tabSet.has(panelValue)) {
        warnTabs(
          `Panel value "${panelValue}" has no matching Tab. Render one Tab per Panel value.`
        )
      }
    }
  }, [registryVersion, listCount])

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
  // control) is left untouched — never stolen. The kernel tab stop
  // follows via the focus itself (Item onFocus sets currentness).
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
      targetEl.focus()
    }
  }, [value, nearestEnabledTab])

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
  // focused tab disables or unmounts, focus moves to the nearest enabled
  // tab (ties to preceding), while selection and the visible panel stay
  // unchanged and no request fires. The kernel tab stop follows via the
  // focus itself. Focus that already moved elsewhere is never stolen.
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
      keepMounted,
      baseId,
      selectionSyncTarget,
      linkageSettled,
      claimTabValue,
      claimPanelValue,
      registerTab,
      registerPanel,
      registerList,
      getTabId,
      getPanelId,
      hasTab,
      hasPanel,
      notePanelFocus,
      noteTabFocus,
    }),
    [
      value,
      setValue,
      orientation,
      activation,
      variant,
      keepMounted,
      baseId,
      selectionSyncTarget,
      linkageSettled,
      claimTabValue,
      claimPanelValue,
      registerTab,
      registerPanel,
      registerList,
      getTabId,
      getPanelId,
      hasTab,
      hasPanel,
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

// Selection→currentness sync (TB-SELECT-03, FEATURES #8): the one
// direction the kernel cannot infer. Rendered (rendering null) inside
// the tablist so the RovingFocus context is in scope. Keyed on the
// target only: selection and registry changes move the stop, while
// focus-diverged stops (manual arrows, rejected nav) never re-run the
// effect and are never snapped back. A layout effect on purpose — the
// write lands (with its synchronous re-render) before the kernel's
// passive settlement pass, so initial mount and selection changes win
// over the first-available default. A null target (no enabled tab)
// leaves the all-disabled zero-stop state to kernel settlement.
function TabsSelectionSync() {
  const tabs = React.useContext(TabsContext)
  const roving = useRovingFocusContext()
  const target = tabs?.selectionSyncTarget ?? null
  const currentId = roving?.currentId ?? null

  useIsomorphicLayoutEffect(() => {
    if (!tabs || !roving || target === null) return
    if (currentId !== target) {
      roving.setCurrentId(target)
    }
    // Deps are the target alone by design (see above); contexts are
    // stable enough (Root memo) and currentId is read fresh per target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return null
}

export type TabsListProps = PrimitiveProps<'div'> & {
  variant?: TabsVariantProp
}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  function TabsList(
    {
      children,
      variant: variantProp,
      className,
      style,
      onKeyDown,
      // Managed-wins (TB-DOM-09): orientation state is kernel-owned;
      // consumer conflicts are dropped while unrelated props survive.
      'aria-orientation': _dropAriaOrientation,
      ...props
    }: TabsListProps,
    forwardedRef
  ) {
    void _dropAriaOrientation
    // data-* needs a Record cast: TS allows data-* at JSX sites but the
    // prop types carry no index signature to destructure from.
    const { 'data-orientation': _dropDataOrientation, ...listProps } =
      props as typeof props & Record<string, unknown>
    void _dropDataOrientation
    const context = React.useContext(TabsContext)
    const orientation = context?.orientation ?? 'horizontal'
    const variant = variantProp ?? context?.variant ?? 'line'

    // List subscription for the TB-DOM-13 one-List diagnostic. Layout
    // timing, like Tab/Panel registration: a passive subscription settles
    // after the parent's passive diagnostic reads the count, false-firing
    // the no-List error on every correct mount.
    const registerList = context?.registerList
    useIsomorphicLayoutEffect(() => {
      if (!registerList) return
      return registerList()
    }, [registerList])

    // Observe-only activation (automatic mode): the RovingFocus kernel
    // moves focus synchronously at the tab during the keydown dispatch;
    // this bubble-phase handler reads the RESULT. A destination tab in
    // this list that differs from the keydown source means the kernel
    // moved — request it. Consumer-prevented keys never move (source and
    // destination coincide), and nested-instance keys scope out via the
    // closest-tablist checks, so no defaultPrevented inspection is needed
    // (the kernel's own preventDefault is indistinguishable from a
    // consumer's at bubble time). Tabs owns this activation policy only;
    // arrows, wrap, Home/End, RTL, and the tab stop are the kernel's.
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (context?.activation !== 'automatic') return

      const fromEl = e.target as Element | null
      const sourceTab = fromEl?.closest?.('[role="tab"]') ?? null
      const destTab =
        getDeepActiveElement(e.currentTarget)?.closest?.('[role="tab"]') ??
        null
      if (!sourceTab || !destTab || destTab === sourceTab) return
      if (sourceTab.closest('[role="tablist"]') !== e.currentTarget) return
      if (destTab.closest('[role="tablist"]') !== e.currentTarget) return
      const val = destTab.getAttribute('data-value')
      if (val) {
        context.setValue(val)
      }
    }

    // Variant chrome resolves through the system recipe: the call takes the
    // kernel union, and unknown author names match no table axis at runtime,
    // so they resolve to base + axis classes with no built-in paint.
    const recipeClasses = tabsListRecipe({
      variant: variant as TabsVariant,
      orientation,
    })

    return (
      <RovingFocus.Root
        orientation={orientation}
        loop
        typeahead={false}
      >
        <Div
          role="tablist"
          aria-orientation={orientation}
          data-orientation={orientation}
          data-variant={variant}
          data-reference-tabs-list=""
          onKeyDown={handleKeyDown}
          className={className ? `${recipeClasses} ${className}` : recipeClasses}
          style={{
            borderBottomColor: variant === 'line' && orientation === 'horizontal' ? 'var(--colors-ui-table-border)' : undefined,
            borderRightColor: variant === 'line' && orientation === 'vertical' ? 'var(--colors-ui-table-border)' : undefined,
            ...style,
          }}
          ref={forwardedRef}
          {...listProps}
        >
          {children}
          <TabsSelectionSync />
        </Div>
      </RovingFocus.Root>
    )
  }
)

TabsList.displayName = 'Tabs.List'

export type TabProps = Omit<PrimitiveProps<'button'>, 'value'> & {
  value: string
  variant?: TabsVariantProp
}

// Interactive descendants that own their own activation (TB-EVENT-01/02):
// clicks bubbling from these (including native Space/Enter keyup-clicks
// from nested or portalled editables) must not select the tab. Plain
// label chrome (spans, icons) still activates.
const TAB_EDITABLE_SELECTOR =
  'input,textarea,select,[contenteditable]:not([contenteditable="false"])'

function isEditableClickTarget(target: Element | null): boolean {
  if (!target || typeof target.closest !== 'function') return false
  return target.closest(TAB_EDITABLE_SELECTOR) !== null
}

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  function Tab(
    {
      value,
      children,
      variant: variantProp,
      disabled: disabledProp,
      onClick,
      onFocus,
      onPointerDown,
      onMouseDown,
      className,
      style,
      id: idProp,
      // Managed-wins (TB-DOM-09): selection state and panel linkage are
      // kernel-owned; consumer conflicts are dropped while unrelated
      // data/aria/class/style props survive.
      'aria-selected': _dropAriaSelected,
      'aria-controls': _dropAriaControls,
      ...props
    }: TabProps,
    forwardedRef
  ) {
    void _dropAriaSelected
    void _dropAriaControls
    // data-* needs a Record cast (see TabsList).
    const {
      'data-state': _dropDataState,
      'data-disabled': _dropDataDisabled,
      ...tabProps
    } = props as typeof props & Record<string, unknown>
    void _dropDataState
    void _dropDataDisabled
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
    // Dangling-linkage guard (TB-DOM-13): once the client commit is
    // settled, a selected tab with no registered Panel omits
    // aria-controls instead of pointing at a missing element. SSR and
    // first render keep the generated fallback so valid trees hydrate
    // linked (TB-ENV-01).
    const panelLinked = !(context?.linkageSettled ?? false) || (context?.hasPanel(value) ?? true)

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
    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        tabRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
        }
      },
      [forwardedRef]
    )
    const registerTab = context?.registerTab
    useIsomorphicLayoutEffect(() => {
      if (!registerTab || tabId === undefined) return
      return registerTab(value, {
        id: tabId,
        element: tabRef.current,
        disabled: isDisabled,
      })
    }, [registerTab, value, tabId, isDisabled])

    // Pointerdown-early gesture flags (TB-SELECT-08): the completing
    // click for the same value is the same gesture, not a second request.
    // Per-tab: a pointerdown and its click always share the tab. Stale
    // flags (aborted gestures) are overwritten by the next pointerdown,
    // and every real click is preceded by one.
    const pendingPointerValueRef = React.useRef<string | null>(null)
    const requestedPointerValueRef = React.useRef<string | null>(null)
    const canceledPointerValueRef = React.useRef<string | null>(null)

    // Pointerdown-early activation (TB-SELECT-08): a primary press on an
    // enabled unselected tab arms the request; the native mousedown-default
    // focus fires the tab's focus handler, which requests — so blur, tab
    // focus, and onChange order themselves (TB-SELECT-06) with zero script
    // focus. Never focus() here: a script focus during a mouse press
    // matches :focus-visible and paints a ring the settled snapshots pin
    // as absent, while the native focus it replaces resolves mouse
    // modality. Consumer-first: a consumer preventDefault on the press
    // cancels (the completing click is suppressed too). Disabled,
    // selected, and non-primary presses are untouched.
    const requestFromPress = (e: React.SyntheticEvent<HTMLButtonElement>) => {
      if (!context || isDisabled) return
      if (canceledPointerValueRef.current === value) return
      if (e.defaultPrevented) {
        // Consumer canceled the press: suppress the completing click.
        canceledPointerValueRef.current = value
        return
      }
      // Event-target guard (TB-EVENT-01/02): presses that start in an
      // editable descendant (nested inputs, portalled editables whose
      // React-tree events bubble through the tab) keep their focus and
      // request nothing — mirroring the click guard below, since a real
      // click on the editable press-fires before it click-fires.
      if (
        e.target !== e.currentTarget &&
        isEditableClickTarget(e.target as Element | null)
      ) {
        return
      }
      if (pendingPointerValueRef.current === value) return
      if (context.value === value) return
      pendingPointerValueRef.current = value
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e)
      if ((e as React.PointerEvent).button !== 0) return
      requestFromPress(e)
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseDown?.(e)
      if (e.button !== 0) return
      requestFromPress(e)
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      // Same-gesture paths (TB-SELECT-08): a press-armed click is the
      // same gesture, not a second request. When the focus handler
      // already requested, the click is pure dedupe; when focus never
      // fired (the tab already held focus), the click requests only if
      // focus demonstrably landed here — a press whose focus never
      // arrived (consumer mousedown-preventDefault) stays silent.
      if (pendingPointerValueRef.current === value) {
        pendingPointerValueRef.current = null
        const wasRequested = requestedPointerValueRef.current === value
        requestedPointerValueRef.current = null
        if (e.defaultPrevented) return
        if (
          e.target !== e.currentTarget &&
          isEditableClickTarget(e.target as Element | null)
        ) {
          return
        }
        if (wasRequested) return
        const host = e.currentTarget as unknown as HTMLElement
        if (getDeepActiveElement(host) === host && !isDisabled && context) {
          context.setValue(value)
        }
        return
      }
      requestedPointerValueRef.current = null
      // Press-canceled gestures (consumer preventDefault on the press):
      // the completing click is suppressed with the press.
      if (canceledPointerValueRef.current === value) {
        canceledPointerValueRef.current = null
        return
      }
      if (e.defaultPrevented) return
      // Event-target guard (TB-EVENT-01/02): activation from editable
      // descendants (nested inputs, portalled editables whose React-tree
      // clicks bubble through the tab) is ignored without stopping
      // bubbling globally.
      if (
        e.target !== e.currentTarget &&
        isEditableClickTarget(e.target as Element | null)
      ) {
        return
      }
      // Retargeted-activation guard (TB-EVENT-01): Chrome retargets
      // Space/Enter activation clicks from a nested editable to the
      // ancestor button (detail 0, target the tab itself), so the target
      // guard above cannot see them. A keyboard-synthesized click
      // (detail 0) while focus sits on a nested descendant is that
      // retarget — ignore it. Legit keyboard activation has focus on
      // the tab; real pointer clicks carry detail ≥ 1; unfocused
      // synthetic clicks (unit bare clicks) have no nested focus.
      if (e.detail === 0) {
        const host = e.currentTarget as unknown as HTMLElement
        const active = getDeepActiveElement(host)
        if (active && active !== host && host.contains(active)) {
          return
        }
      }
      if (!isDisabled && context) {
        context.setValue(value)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      onFocus?.(e)
      // The kernel tab stop tracks focus; Tabs records the handoff trail
      // (every tab focus, even a disabled one where the engine allows it).
      context?.noteTabFocus(value)
      // Press-armed request (TB-SELECT-08): the native mousedown-default
      // focus lands after the press armed, so the request fires here —
      // after blur and focus, before mouseup/click (TB-SELECT-06). Focus
      // without an armed press (arrows, Tab key, programmatic) never
      // requests. setValue redundant-suppresses, so re-focusing the
      // selected tab is a silent no-op.
      if (
        context &&
        !isDisabled &&
        e.target === e.currentTarget &&
        pendingPointerValueRef.current === value &&
        requestedPointerValueRef.current !== value
      ) {
        requestedPointerValueRef.current = value
        context.setValue(value)
      }
    }

    // Variant chrome resolves through the system recipe (same unknown-name
    // rule as the list: base + axis classes, no built-in paint).
    const recipeClasses = tabsTabRecipe({
      variant: variant as TabsVariant,
      orientation,
      selected: isSelected ? 'selected' : 'unselected',
      disabled: isDisabled ? 'disabled' : 'enabled',
    })

    // No nested-focusable keydown guard here: preventing the keydown
    // would break typing/caret in the nested editable itself
    // (TB-EVENT-01). The kernel ignores non-arrow keys with typeahead
    // off, and the click-target guard above absorbs native Space/Enter
    // keyup-clicks — the same division Radix uses. (Arrow keys from a
    // nested focusable do drive kernel movement; that shape is invalid
    // HTML and unpinned.)
    return (
      <RovingFocus.Item id={value} disabled={isDisabled}>
        <Button
          type="button"
          role="tab"
          ref={setRefs}
          id={tabId}
          aria-selected={isSelected}
          aria-controls={isSelected && panelLinked ? panelId : undefined}
          data-state={isSelected ? 'active' : 'inactive'}
          data-variant={variant}
          data-disabled={isDisabled ? '' : undefined}
          data-value={value}
          disabled={isDisabled}
          onClick={handleClick}
          onFocus={handleFocus}
          onPointerDown={handlePointerDown}
          onMouseDown={handleMouseDown}
          className={className ? `${recipeClasses} ${className}` : recipeClasses}
          style={style}
          {...tabProps}
        >
          {children}
        </Button>
      </RovingFocus.Item>
    )
  }
)

Tab.displayName = 'Tabs.Tab'

export type TabPanelProps = Omit<PrimitiveProps<'div'>, 'value'> & {
  value: string
  keepMounted?: boolean
}

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
    // Root keepMounted (W-15) ORs with the per-panel opt-in: either switch
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

export const TabsTrigger = Tab
export const TabsContent = TabPanel

Tabs.List = TabsList
Tabs.Tab = Tab
Tabs.Trigger = Tab
Tabs.Panel = TabPanel
Tabs.Content = TabPanel

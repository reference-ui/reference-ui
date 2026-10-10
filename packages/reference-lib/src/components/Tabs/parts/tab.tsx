/**
 * Tabs.Tab: one tab stop with pointerdown-early activation. Takes the
 * tab value plus an optional variant override, registers its identity
 * for ARIA linkage, and funnels presses, focus, and clicks through one
 * gesture state so blur, focus, and onChange order themselves with
 * zero script focus. Editable descendants never select the tab.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'
import { RovingFocus } from '../../RovingFocus'
import { TabsContext } from '../context'
import { getDeepActiveElement } from '../focus/deep-active'
import { isEditableClickTarget } from '../focus/editable'
import { tabsTabRecipe } from '../recipes/tab-recipe'
import { useIsomorphicLayoutEffect } from '../shared/layout-effect'
import type { TabProps, TabsVariant } from '../types'

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

/**
 * Tabs.List: the tablist row and RovingFocus root. Takes children plus
 * an optional variant override, subscribes for the one-List diagnostic,
 * and owns the automatic-activation policy — reading the kernel's
 * focus result at bubble time and requesting the destination tab.
 * Arrows, wrap, Home/End, RTL, and the tab stop are the kernel's.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { RovingFocus } from '../../RovingFocus'
import { TabsContext } from '../context'
import { getDeepActiveElement } from '../focus/deep-active'
import { tabsListRecipe } from '../recipes/list-recipe'
import { useIsomorphicLayoutEffect } from '../shared/layout-effect'
import type { TabsListProps, TabsVariant } from '../types'
import { TabsSelectionSync } from './selection-sync'

export const TabsList: React.ForwardRefExoticComponent<
  TabsListProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, TabsListProps>(
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

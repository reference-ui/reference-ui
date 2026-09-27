// Worked system-variant example (HQ mechanism): a userland Tabs flavor with
// its own TYPED variant name, styled by its own recipes. No variants prop,
// no theme registry — normal recipe() calls with userland classNames, plus
// the open kernel `variant` prop carrying the name through. Not exported
// from the barrel: this is the pattern demo, not API.
import * as React from 'react'
import { css, recipe, type RecipeVariantProps } from '@reference-ui/react'
import { Tabs, type TabsListProps, type TabProps } from './Tabs'

export const myTabsList = recipe({
  className: 'myTabsList',
  // Lean base: only the chrome this flavor owns. Position and the
  // orientation direction compose in from the kernel base + axis classes.
  base: {
    display: 'flex',
    gap: '1r',
    p: '0',
    bg: 'transparent',
  },
  variants: {
    variant: {
      underline: {
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'ui.table.border',
      },
    },
  },
})

export const myTabsTab = recipe({
  className: 'myTabsTab',
  // Lean base: only the layout this flavor owns. Font, cursor, border
  // reset, transition, and the disabled axis all compose in from the
  // kernel base classes (same layer — setting them here too would fight
  // by stylesheet order instead of composing).
  base: {
    px: '3r',
    pt: '2r',
    pb: '2.5r',
  },
  variants: {
    variant: {
      underline: {
        marginBottom: '-1px',
      },
    },
    selected: {
      selected: { color: 'design.text.base' },
      unselected: { color: 'design.text.light' },
    },
  },
})

// The indicator border collides with the kernel base `border: none` in the
// same recipes layer, so it arrives via css() utilities, which beat recipes
// by layer order. Static call sites (one per state); the component picks.
const underlineIndicatorSelected = css({
  borderBottom: '2px solid',
  borderBottomColor: 'ui.focus.ring',
})
const underlineIndicatorUnselected = css({
  borderBottom: '2px solid transparent',
})

// The user's OWN typed variant: inferred from their recipe, not the kernel.
export type MyTabsVariant = RecipeVariantProps<typeof myTabsTab>['variant']

export type MyTabsListProps = Omit<TabsListProps, 'variant'> & {
  variant?: MyTabsVariant
}

export function MyTabsList({
  variant = 'underline',
  className,
  ...props
}: MyTabsListProps) {
  const recipeClasses = myTabsList({ variant })
  return (
    <Tabs.List
      variant={variant}
      className={className ? `${recipeClasses} ${className}` : recipeClasses}
      {...props}
    />
  )
}

export type MyTabsTabProps = Omit<TabProps, 'variant'> & {
  variant?: MyTabsVariant
  selected: boolean
}

export function MyTabsTab({
  variant = 'underline',
  selected,
  className,
  ...props
}: MyTabsTabProps) {
  const recipeClasses = myTabsTab({
    variant,
    selected: selected ? 'selected' : 'unselected',
  })
  const indicator = selected
    ? underlineIndicatorSelected
    : underlineIndicatorUnselected
  const combined = className
    ? `${recipeClasses} ${indicator} ${className}`
    : `${recipeClasses} ${indicator}`
  return <Tabs.Tab variant={variant} className={combined} {...props} />
}

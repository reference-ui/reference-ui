/**
 * Tabs' public contract: orientation, activation, and variant knobs plus
 * the root/list/tab/panel prop types. The variant prop stays open (any
 * author recipe name typechecks) while the kernel union names the
 * prepackaged styles. Kept free of JSX and logic so parts, recipes, and
 * userland flavors import the shape without mounting anything.
 */
import type * as React from 'react'
import type { PrimitiveProps } from '@reference-ui/react'

export type TabsOrientation = 'horizontal' | 'vertical'
export type TabsActivation = 'automatic' | 'manual'
export type TabsVariant = 'line' | 'pill'
/**
 * System-level variant: the prepackaged
 * `line`/`pill` names plus any author recipe name. Custom names typecheck
 * here and render through the author's own recipe classes; the kernel
 * recipes below resolve unknown names to base + axis classes with no
 * built-in paint. There is no variants prop and no theme registry — the
 * style system's `css()`/`recipe()` calls ARE the extension API.
 */
export type TabsVariantProp = TabsVariant | (string & {})

export interface TabsProps {
  children?: React.ReactNode
  /**
   * Controlled selection. Omit it to let Tabs manage its own.
   * @default the first enabled tab
   */
  value?: string
  /** Called when the user selects a different tab, controlled or not. */
  onChange?: (value: string) => void
  /**
   * Which arrow keys move between tabs.
   * @default 'horizontal'
   */
  orientation?: TabsOrientation
  /**
   * `automatic` selects a tab on focus. `manual` waits for `Enter` or `Space`.
   * @default 'automatic'
   */
  activation?: TabsActivation
  /**
   * Built-in look, or your own variant name.
   * @default 'line'
   */
  variant?: TabsVariantProp
  /**
   * Keep every inactive panel's children mounted.
   * @default false
   */
  keepMounted?: boolean
}

export type TabsListProps = PrimitiveProps<'div'> & {
  /**
   * Overrides the root's variant for the list.
   * @default the root's `variant`
   */
  variant?: TabsVariantProp
}

export type TabProps = Omit<PrimitiveProps<'button'>, 'value'> & {
  /** Required. Unique within the Tabs; matches a `Tabs.Panel`. */
  value: string
  /**
   * Can't be selected, and arrow keys skip it.
   * @default false
   */
  disabled?: boolean
  /**
   * Overrides the root's variant for this tab.
   * @default the root's `variant`
   */
  variant?: TabsVariantProp
}

export type TabPanelProps = Omit<PrimitiveProps<'div'>, 'value'> & {
  /** Required. Matches a `Tabs.Tab`. */
  value: string
  /**
   * Keep this panel's children mounted while inactive.
   * @default false
   */
  keepMounted?: boolean
}

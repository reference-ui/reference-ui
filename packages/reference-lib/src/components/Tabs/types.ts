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

export type TabsListProps = PrimitiveProps<'div'> & {
  variant?: TabsVariantProp
}

export type TabProps = Omit<PrimitiveProps<'button'>, 'value'> & {
  value: string
  variant?: TabsVariantProp
}

export type TabPanelProps = Omit<PrimitiveProps<'div'>, 'value'> & {
  value: string
  keepMounted?: boolean
}

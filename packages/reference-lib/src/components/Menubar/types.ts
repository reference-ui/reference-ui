/**
 * Menubar's public contract: the controlled bar value, root/menu/trigger/content
 * prop types. Trigger and content props alias the Popover parts Menubar
 * composes, so the bar inherits their surface without restating it. Kept
 * free of JSX and logic so parts and consumers import the shape cheaply.
 */
import type { PrimitiveProps } from '@reference-ui/react'
import type { PopoverContentProps, PopoverTriggerProps } from '../Popover'

export type MenubarValue = string | null

export type MenubarProps = Omit<PrimitiveProps<'div'>, 'onChange'> & {
  /** Required. The open menu's value, or `null` when none is open. */
  value: MenubarValue
  /** Required. Called when the user opens, switches or closes a menu. */
  onChange: (value: MenubarValue) => void
  /**
   * Wrap arrow-key movement and menu switching at the ends of the bar.
   * @default false
   */
  loop?: boolean
}

export type MenubarMenuProps = {
  /**
   * The menu's value in the bar. Must be unique.
   * @default generated
   */
  value?: string
  children?: React.ReactNode
}

export type MenubarTriggerProps = PopoverTriggerProps & {
  /**
   * The menu cannot open, and the arrow keys skip it.
   * @default false
   */
  disabled?: boolean
  /**
   * The trigger's button style.
   * @default 'ghost'
   */
  variant?: PopoverTriggerProps['variant']
  /**
   * Announced popup type.
   * @default 'menu'
   */
  'aria-haspopup'?: PopoverTriggerProps['aria-haspopup']
}

export type MenubarContentProps = PopoverContentProps

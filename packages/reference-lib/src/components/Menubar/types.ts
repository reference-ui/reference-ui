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
  /** Open menu. `null` means none open. Required: Menubar is controlled-only. */
  value: MenubarValue
  /** Fires on user-driven open-menu changes. Never redundant. Required. */
  onChange: (value: MenubarValue) => void
  /** Wrap trigger arrows and menu switching at the edges. Default false. */
  loop?: boolean
}

export type MenubarMenuProps = {
  /** Identity within the bar. Defaults to a stable generated id. */
  value?: string
  children?: React.ReactNode
}

export type MenubarTriggerProps = PopoverTriggerProps

export type MenubarContentProps = PopoverContentProps

/**
 * Menu's public contract: root, trigger, content, command, choice, link,
 * and separator prop types plus the keyboard-entry strategy. Content
 * props alias the Overlay vocabulary Menu composes; choice items spell
 * their controlled checked/value pairs. Kept free of JSX and logic so
 * parts, hooks, and sibling menus import the shape without mounting.
 */
import type { PrimitiveProps } from '@reference-ui/react'
import type { OverlayContentProps } from '../Overlay'

export type MenuProps = PrimitiveProps<'div'> & {
  /** Nested-only: controlled submenu open. Omitted nested open is controlled false. */
  open?: boolean
  /** Nested-only: submenu open request. */
  onOpen?: () => void
  /** Nested-only: submenu dismiss request. */
  onDismiss?: () => void
}

export type MenuEntryStrategy = 'first' | 'last' | null

export type MenuTriggerProps = PrimitiveProps<'div'> & {
  disabled?: boolean
  textValue?: string
}

export type MenuContentProps = OverlayContentProps

export type MenuItemProps = Omit<PrimitiveProps<'div'>, 'onSelect'> & {
  disabled?: boolean
  selected?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnClick?: boolean
  /** @deprecated Use closeOnClick instead */
  closeOnSelect?: boolean
}

export type MenuCheckboxItemProps = Omit<PrimitiveProps<'div'>, 'onSelect' | 'onChange'> & {
  checked: boolean | 'mixed'
  onChange?: (checked: boolean) => void
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnSelect?: boolean
}

export type MenuRadioGroupProps = Omit<PrimitiveProps<'div'>, 'onChange'> & {
  value?: string | null
  onChange?: (value: string) => void
}

export type MenuRadioItemProps = Omit<PrimitiveProps<'div'>, 'onSelect'> & {
  value: string
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnSelect?: boolean
}

export type MenuLinkItemProps = Omit<PrimitiveProps<'a'>, 'onSelect'> & {
  href: string
  disabled?: boolean
  textValue?: string
  onSelect?: (event: Event) => void
  closeOnSelect?: boolean
}

export type MenuSeparatorProps = PrimitiveProps<'div'>

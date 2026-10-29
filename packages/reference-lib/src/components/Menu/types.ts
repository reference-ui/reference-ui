/**
 * Menu's public contract: root, trigger, content, command, choice, link,
 * and separator prop types plus the keyboard-entry strategy. Content
 * props alias the Overlay vocabulary Menu composes; choice items spell
 * their controlled checked/value pairs. Kept free of JSX and logic so
 * parts, hooks, and sibling menus import the shape without mounting.
 */
import type { PrimitiveProps } from '@reference-ui/react'
import type * as React from 'react'
import type { OverlayContentProps } from '../Overlay'

export type MenuProps = PrimitiveProps<'div'> & {
  /**
   * Submenu only. Whether the submenu is open.
   * @default false
   */
  open?: boolean
  /** Submenu only. Called when the submenu asks to open. */
  onOpen?: () => void
  /** Submenu only. Called when the submenu asks to close. */
  onDismiss?: () => void
}

export type MenuEntryStrategy = 'first' | 'last' | null

export type MenuTriggerProps = PrimitiveProps<'div'> & {
  /**
   * The submenu cannot open.
   * @default false
   */
  disabled?: boolean
  /** Text used for typeahead. */
  textValue?: string
}

export type MenuContentProps = OverlayContentProps

export type MenuItemProps = Omit<PrimitiveProps<'div'>, 'onSelect'> & {
  /**
   * Skipped by the keyboard and not selectable.
   * @default false
   */
  disabled?: boolean
  /**
   * Highlights the item and sets `data-state="selected"`.
   * @default false
   */
  selected?: boolean
  /** Text used for typeahead. Defaults to the item's text. */
  textValue?: string
  /** Called on click, Enter or Space. `preventDefault()` keeps the menu open. */
  onSelect?: (event: Event) => void
  /**
   * Close the whole menu after selection.
   * @default true
   */
  closeOnClick?: boolean
  /** @deprecated Alias for `closeOnClick`. */
  closeOnSelect?: boolean
}

export type MenuCheckboxItemProps = Omit<PrimitiveProps<'div'>, 'onSelect' | 'onChange'> & {
  /** Required. The checked state. */
  checked: boolean | 'mixed'
  /** Called with the next state. */
  onChange?: (checked: boolean) => void
  /**
   * Skipped by the keyboard and not selectable.
   * @default false
   */
  disabled?: boolean
  /** Text used for typeahead. */
  textValue?: string
  /** Called before `onChange`. `preventDefault()` cancels it. */
  onSelect?: (event: Event) => void
  /**
   * Close the whole menu after selection.
   * @default false
   */
  closeOnSelect?: boolean
}

export type MenuRadioGroupProps = Omit<PrimitiveProps<'div'>, 'onChange'> & {
  /** The checked item's value. */
  value?: string | null
  /** Called with the activated item's value, even if it is already checked. */
  onChange?: (value: string) => void
}

export type MenuRadioItemProps = Omit<PrimitiveProps<'div'>, 'onSelect'> & {
  /** Required. The item's value. */
  value: string
  /**
   * Skipped by the keyboard and not selectable.
   * @default false
   */
  disabled?: boolean
  /** Text used for typeahead. */
  textValue?: string
  /** Called before the group's `onChange`. `preventDefault()` cancels it. */
  onSelect?: (event: Event) => void
  /**
   * Close the whole menu after selection.
   * @default false
   */
  closeOnSelect?: boolean
}

export type MenuLinkItemProps = Omit<PrimitiveProps<'a'>, 'onSelect'> & {
  /** Required. The link target. */
  href: string
  /**
   * Not navigable, skipped by the keyboard.
   * @default false
   */
  disabled?: boolean
  /** Text used for typeahead. */
  textValue?: string
  /** Called on a plain click. `preventDefault()` cancels navigation and closing. */
  onSelect?: (event: Event) => void
  /**
   * Close the whole menu after selection.
   * @default true
   */
  closeOnSelect?: boolean
}

export type MenuSeparatorProps = PrimitiveProps<'div'>

/** The handlers `useMenuTriggerKeys` returns. Spread both on the `Popover.Trigger` that opens a root menu. */
export interface MenuTriggerKeys {
  /** Opens the menu from ArrowDown, ArrowUp, Enter or Space. A keyboard opening focuses the first item, or the last for ArrowUp. */
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  /** A pointer opening focuses the menu itself, never an item. */
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

/** The handlers `useMenuContextKeys` returns. Spread both on a context-menu target. */
export interface MenuContextKeys {
  /** Makes the next opening focus the first item. */
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void
  /** Does the same for the ContextMenu key and Shift+F10. */
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void
}

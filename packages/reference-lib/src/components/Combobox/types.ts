/**
 * Combobox's public contract: root, input, trigger, popover, and virtual-
 * item props. The context value, option entries, adapters, and navigation
 * vocabulary live in combobox-context.ts (the shared scope Listbox and
 * Tree import); this file holds only the component props. Kept free of
 * JSX and logic so parts, hooks, and consumers can import the shape
 * without mounting anything.
 */
import type { PrimitiveProps } from '@reference-ui/react'
import type * as React from 'react'
import type { OverlayContentProps } from '../Overlay'
import type { ComboboxAutocomplete, ComboboxGridAdapter } from './combobox-context'

export interface ComboboxProps {
  children?: React.ReactNode
  /** Required. The selected option's value. `null` is the empty value. */
  value: string | null
  /** Required. Called with each new selection. */
  onChange: (value: string | null) => void
  /** Controlled input text. */
  inputValue?: string
  /** Input text on first render when `inputValue` is omitted. */
  defaultInputValue?: string
  /** Called when the input text changes. */
  onInputValueChange?: (value: string) => void
  /** Same as `onInputValueChange`. Used only when that prop is omitted. */
  onInputChange?: (value: string) => void
  /** Controlled open state. Omit it to let Combobox manage its own. */
  open?: boolean
  /**
   * Open state on first render when `open` is omitted.
   * @default false
   */
  defaultOpen?: boolean
  /** Called when the list opens. */
  onOpen?: () => void
  /** Called when the list closes. */
  onDismiss?: () => void
  /** Called on every open and close request. */
  onOpenChange?: (open: boolean) => void
  /**
   * Disables the input or trigger.
   * @default false
   */
  disabled?: boolean
  /**
   * Close and resolve the text when focus leaves. With `false`, the list and
   * the typed text stay as they are when focus leaves.
   * @default true
   */
  closeOnBlur?: boolean
  /**
   * Whether the input completes the active option's label inline.
   * @default 'list'
   */
  autocomplete?: ComboboxAutocomplete
  /**
   * Commit text that matches no option as the value. It applies on Enter, Tab
   * and blur, and empty text becomes `null`.
   * @default false
   */
  allowCustomValue?: boolean
  /** Called on Escape while open. `preventDefault()` keeps the list open and the text as it is. */
  onEscape?: (event: KeyboardEvent) => void
  /**
   * Marks the list `aria-busy`.
   * @default false
   */
  loading?: boolean
  /**
   * Announced when the list is empty and the input is empty. Not announced
   * while `loading` is true.
   * @default 'No options available'
   */
  emptyMessage?: string
  /**
   * Announced when the list is empty and the input has text. Not announced
   * while `loading` is true.
   * @default 'No results found'
   */
  noResultsMessage?: string
}

export type ComboboxInputProps = Omit<
  PrimitiveProps<'input'>,
  'value' | 'defaultValue' | 'onChange'
> & {
  value?: never
  defaultValue?: never
  /**
   * Rejected (CB-DOM-11): root `inputValue` + `onInputValueChange` is
   * the only text authority. Observe/cancel the native edit through
   * `onInput` / `onBeforeInput` instead — the type surface rejects this
   * and bypassed JS gets a diagnostic, never a callback.
   */
  onChange?: never
}

export type ComboboxTriggerProps = PrimitiveProps<'button'>

export type ComboboxPopoverProps = OverlayContentProps & {
  /**
   * Side and alignment against the input.
   * @default 'bottom-start'
   */
  placement?: OverlayContentProps['placement']
  /**
   * Replaces the generated id the input points to.
   * @default generated
   */
  id?: string
  /** Navigation data for a custom grid of `Combobox.VirtualItem` cells. */
  virtualFocus?: ComboboxGridAdapter
}

export type ComboboxVirtualItemProps = {
  /** Logical index into the authored `virtualFocus` adapter items. */
  index: number
  /** Exactly one native child; behavior slots onto it with no wrapper. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

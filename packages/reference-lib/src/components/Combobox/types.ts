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
  /** Required controlled selection (`null` is the empty value). There is no
   * `defaultValue` and no uncontrolled branch. */
  value: string | null
  /** Required commit callback — every selection request emits here and the
   * parent owns the value (no silent-frozen controlled). */
  onChange: (value: string | null) => void
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (value: string) => void
  onInputChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onDismiss?: () => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  /**
   * Blur policy (#3). `true` (default) reverts unmatched text (editable)
   * and dismisses when focus leaves the combobox; `false` preserves
   * open/text state on blur while Escape and explicit dismissal still close.
   */
  closeOnBlur?: boolean
  /**
   * Inline-completion policy (#1, default `"list"`). Mirrors
   * `aria-autocomplete` on the Input; `"inline"` and `"both"` complete
   * the active option's label inline with suffix-only selection,
   * restoring the typed prefix when active clears. Never emits text
   * callbacks for preview navigation. Inert for select-only Triggers
   * (no text).
   */
  autocomplete?: ComboboxAutocomplete
  /**
   * Custom-value policy (#2, Ark-exact name, default `false`).
   * `true` commits exact unmatched text as the value on Enter, Tab, and
   * blur/outside-press (empty text maps to `null`); the string is never
   * normalized. `false` restores the committed text on those paths with
   * no value callback. An active option always wins over custom text.
   * Escape always reverts, regardless of this policy. Inert for
   * select-only Triggers (no text).
   */
  allowCustomValue?: boolean
  /**
   * Granular cancelable Escape hook (#7, Overlay #3 vocabulary). Fires
   * with the real native KeyboardEvent before revert and dismiss;
   * `preventDefault()` stops revert, value callbacks, and dismissal
   * while `open` and descendant DOM stay controlled. Never fires while
   * closed or during IME composition. Combobox owns the path and does
   * not forward to the Overlay layer (no double-fire).
   */
  onEscape?: (event: KeyboardEvent) => void
  /**
   * Async busy state (FEATURES #4, default `false`). `true` marks the
   * popup collection `aria-busy` (the nested listbox/tree node, or the
   * grid popover itself) until the collection resolves. Never renders a
   * private live region — status prose routes through the shared
   * `announce()` below.
   */
  loading?: boolean
  /**
   * Empty-collection status prose (FEATURES #4). Announced once via the
   * shared `announce()` when the open popover's collection is logically
   * empty and the input holds no text — unless an Empty node is authored
   * (its native live region speaks for itself) or `loading` is true.
   */
  emptyMessage?: string
  /**
   * No-results status prose (FEATURES #4). Announced once via the shared
   * `announce()` when the open popover's collection is logically empty
   * and the input holds unmatched text — unless an Empty node is
   * authored (its native live region speaks for itself) or `loading` is
   * true.
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
   * Custom grid adapter (#5). Metadata-only at this layer: the root
   * reads it from authored children (see `authored.ts`), validates
   * single-authority, and drives navigation/mount timing. Never reaches
   * the DOM.
   */
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

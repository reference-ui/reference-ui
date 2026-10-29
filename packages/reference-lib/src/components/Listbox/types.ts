/**
 * Listbox's public contract: selection/orientation unions, the single vs
 * multiple discriminated props, option and adapter shapes, the internal
 * OptionRecord registry entry, the context value options consume, and the
 * compound component faces. Kept free of JSX and logic so parts, hooks,
 * and consumers can import the shape without mounting anything.
 */
import type {
  PrimitiveElement,
  PrimitiveProps,
  PrimitiveTag,
} from '@reference-ui/react'
import type * as React from 'react'

export type ListboxSelection = 'single' | 'multiple'
export type ListboxOrientation = 'horizontal' | 'vertical'
export type ListboxValue<TValue extends string = string> = TValue | TValue[]

export interface VirtualFocusItem<TValue extends string = string> {
  value: TValue
  textValue: string
  disabled?: boolean
}

export interface VirtualFocusAdapter<TValue extends string = string> {
  items: readonly VirtualFocusItem<TValue>[]
  scrollToIndex(index: number): void
}

export type ListboxVirtualAdapter<TValue extends string = string> =
  VirtualFocusAdapter<TValue>

export type ReferencePartProps<Tag extends PrimitiveTag> =
  PrimitiveProps<Tag> & React.RefAttributes<PrimitiveElement<Tag>>

export type ListboxBaseProps = Omit<
  ReferencePartProps<'div'>,
  'onChange' | 'value' | 'defaultValue'
> & {
  /**
   * Layout direction and arrow-key axis.
   * @default 'vertical'
   */
  orientation?: ListboxOrientation
  /**
   * Disables every option.
   * @default false
   */
  disabled?: boolean
}

export type ListboxSingleProps<TValue extends string = string> = ListboxBaseProps & {
  /**
   * Selection mode.
   * @default 'single'
   */
  selection?: 'single'
  /**
   * The selected value.
   * @default null
   */
  value?: TValue | null
  /** Called with the next selection. */
  onChange?: (value: TValue | null) => void
  /** Adapter for a virtualized list. */
  virtual?: ListboxVirtualAdapter<TValue>
}

export type ListboxMultipleProps<TValue extends string = string> = ListboxBaseProps & {
  /** Selection mode. */
  selection: 'multiple'
  /**
   * The selected values.
   * @default []
   */
  value?: TValue[]
  /** Called with the next selection. */
  onChange?: (value: TValue[]) => void
  /** Adapter for a virtualized list. */
  virtual?: ListboxVirtualAdapter<TValue>
}

export type ListboxProps<TValue extends string = string> =
  | ListboxSingleProps<TValue>
  | ListboxMultipleProps<TValue>

export type ListboxOptionProps<TValue extends string = string> =
  ReferencePartProps<'div'> & {
    /** Required. The option's value. */
    value: TValue
    /**
     * Skipped by the keyboard and not selectable.
     * @default false
     */
    disabled?: boolean
    /** Text used for typeahead. Defaults to the children when they are a string, else `value`. */
    textValue?: string
    /** The option's position in `virtual.items`. Virtualized lists only. */
    index?: number
  }

export interface OptionRecord {
  value: string
  id: string
  index?: number
  disabled: boolean
  textValue?: string
  ref: React.RefObject<HTMLDivElement | null>
}

export interface ListboxContextValue {
  selection: ListboxSelection
  orientation: ListboxOrientation
  value: ListboxValue | null
  disabled: boolean
  isOptionSelected: (val: string) => boolean
  selectOption: (val: string) => void
  virtual?: ListboxVirtualAdapter
  focusedValue: string | null
  setFocusedValue: (val: string | null) => void
  preferredTabValue: string | null
  registerOption: (record: OptionRecord) => () => void
  registerRenderValue: (val: string, id: string) => void
  getOrderedOptions: () => OptionRecord[]
  typeaheadHasBuffer: () => boolean
  handleStandaloneTypeahead: (char: string, currentValue: string) => void
  handleVirtualTypeahead: (char: string, currentIndex: number) => void
  pendingVirtualIndex: number | null
  setPendingVirtualIndex: React.Dispatch<React.SetStateAction<number | null>>
  navigateVirtual: (e: React.KeyboardEvent<HTMLElement>, currentIndex: number) => void
  navigateStandalone: (e: React.KeyboardEvent<HTMLElement>, currentEl: HTMLElement) => void
}

export type ListboxSectionProps = PrimitiveProps<'div'> & {
  /** The group's heading. */
  title?: React.ReactNode
}

export type ListboxHeaderProps = PrimitiveProps<'span'>

export type ListboxEmptyProps = PrimitiveProps<'div'>

export type ListboxOptionComponent = {
  <TValue extends string = string>(
    props: ListboxOptionProps<TValue> & React.RefAttributes<HTMLDivElement>
  ): React.ReactElement | null
}


import * as React from 'react'
import {
  Div,
  Span,
  type PrimitiveProps,
  type PrimitiveElement,
  type PrimitiveTag,
} from '@reference-ui/react'
import { CheckIcon } from '@reference-ui/icons'
import { ComboboxContext } from '../Combobox/combobox-context'
import { controlSize, controlHeightPx } from '../../core/theme/primitives/shared'
// Kernel seams (F2 #2): direction + typeahead entry guard converge on
// RovingFocus; the search model stays local (TypeaheadModel lacks the
// LB-KEY-04 empty-buffer cycle branch — see crew log).
import { getDirection, shouldIgnoreTypeaheadKey } from '../RovingFocus/RovingFocus'

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

type ReferencePartProps<Tag extends PrimitiveTag> =
  PrimitiveProps<Tag> & React.RefAttributes<PrimitiveElement<Tag>>

type ListboxBaseProps = Omit<
  ReferencePartProps<'div'>,
  'onChange' | 'value' | 'defaultValue'
> & {
  orientation?: ListboxOrientation
  disabled?: boolean
}

export type ListboxSingleProps<TValue extends string = string> = ListboxBaseProps & {
  selection?: 'single'
  value?: TValue | null
  onChange?: (value: TValue | null) => void
  virtual?: ListboxVirtualAdapter<TValue>
}

export type ListboxMultipleProps<TValue extends string = string> = ListboxBaseProps & {
  selection: 'multiple'
  value?: TValue[]
  onChange?: (value: TValue[]) => void
  virtual?: ListboxVirtualAdapter<TValue>
}

export type ListboxProps<TValue extends string = string> =
  | ListboxSingleProps<TValue>
  | ListboxMultipleProps<TValue>

export type ListboxOptionProps<TValue extends string = string> =
  ReferencePartProps<'div'> & {
    value: TValue
    disabled?: boolean
    textValue?: string
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

export function validateVirtualAdapter<TValue extends string = string>(
  virtual: ListboxVirtualAdapter<TValue>,
  mountedOptions: Array<{ value: TValue; index?: number; disabled?: boolean }>
) {
  const seenValues = new Set<string>()
  for (const item of virtual.items) {
    if (seenValues.has(item.value)) {
      throw new Error(`Duplicate value in virtual items: "${item.value}"`)
    }
    seenValues.add(item.value)
  }

  const seenIndices = new Set<number>()
  for (const opt of mountedOptions) {
    if (opt.index == null || opt.index < 0 || opt.index >= virtual.items.length) {
      throw new Error(
        `Option index ${opt.index} out of range (0..${virtual.items.length - 1})`
      )
    }
    if (seenIndices.has(opt.index)) {
      throw new Error(`Duplicate mounted option index: ${opt.index}`)
    }
    seenIndices.add(opt.index)

    const expectedItem = virtual.items[opt.index]
    if (opt.value !== expectedItem.value) {
      throw new Error(
        `Mounted option value "${opt.value}" does not match virtual item value "${expectedItem.value}" at index ${opt.index}`
      )
    }
    if (Boolean(opt.disabled) !== Boolean(expectedItem.disabled)) {
      throw new Error(
        `Mounted option disabled state does not match virtual item disabled state at index ${opt.index}`
      )
    }
  }
}

function toMountedIndexEntries(records: Iterable<OptionRecord>) {
  return Array.from(records)
    .filter((rec): rec is OptionRecord & { index: number } => rec.index != null)
    .map(rec => ({ value: rec.value, index: rec.index, disabled: rec.disabled }))
}

export function computeNextMultipleSelection<TValue extends string = string>(
  currentValue: TValue | TValue[] | null | undefined,
  toggledValue: TValue,
  orderedKnownValues: readonly TValue[]
): TValue[] {
  const currentArray: readonly TValue[] = Array.isArray(currentValue) ? currentValue : []
  const isCurrentlySelected = currentArray.includes(toggledValue)

  let nextSelectedSet: Set<TValue>
  if (isCurrentlySelected) {
    nextSelectedSet = new Set(currentArray.filter(v => v !== toggledValue))
  } else {
    nextSelectedSet = new Set([...currentArray, toggledValue])
  }

  const knownSelected: TValue[] = []
  for (const val of orderedKnownValues) {
    if (nextSelectedSet.has(val)) {
      knownSelected.push(val)
      nextSelectedSet.delete(val)
    }
  }

  const unknownSelected: TValue[] = []
  for (const val of currentArray) {
    if (nextSelectedSet.has(val) && !unknownSelected.includes(val)) {
      unknownSelected.push(val)
      nextSelectedSet.delete(val)
    }
  }
  if (nextSelectedSet.has(toggledValue) && !unknownSelected.includes(toggledValue)) {
    unknownSelected.push(toggledValue)
  }

  return [...knownSelected, ...unknownSelected]
}

function isInteractiveDescendant(
  target: EventTarget | null,
  currentTarget: EventTarget | null
): boolean {
  if (!target || target === currentTarget) return false
  const el = target as HTMLElement
  const tag = el.tagName?.toLowerCase()
  if (['input', 'textarea', 'select', 'button'].includes(tag)) return true
  if (el.isContentEditable) return true
  return false
}

interface ListboxContextValue {
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

const ListboxContext = React.createContext<ListboxContextValue | null>(null)

// String-typed forwardRef implementation (LB-DOM-05: the option ref promise
// holds on React 17/18 too, where ref-as-prop does not exist). The public
// generic face follows the same cast pattern as ListboxComponentBase.
const ListboxOptionBase = React.forwardRef<HTMLDivElement, ListboxOptionProps>(
  function ListboxOption(
    {
      value,
      disabled = false,
      textValue,
      index,
      children,
      onClick,
      onKeyDown,
      onKeyDownCapture,
      onPointerDown,
      onMouseDown,
      onPointerEnter,
      onFocus,
      className,
      style,
      id: idProp,
      ...props
    }: ListboxOptionProps,
    forwardedRef
  ) {
  const context = React.useContext(ListboxContext)
  const combobox = React.useContext(ComboboxContext)
  const optionRef = React.useRef<HTMLDivElement | null>(null)
  const optionId = idProp ?? `ref-opt-${value}`

  const composedOptionRef = (node: HTMLDivElement | null) => {
    optionRef.current = node
    if (typeof forwardedRef === 'function') {
      forwardedRef(node)
    } else if (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef) {
      ;(forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }

  // LB-DOM-06: Register and check uniqueness during render
  context?.registerRenderValue(value, optionId)

  const isDisabled = disabled || (context?.disabled ?? false)
  const isSelected = context
    ? context.isOptionSelected(value)
    : combobox
      ? combobox.value === value
      : false

  const hasTriggeredPressRef = React.useRef(false)

  // Combobox option registration
  React.useEffect(() => {
    if (combobox?.registerOption) {
      return combobox.registerOption({
        value,
        id: optionId,
        node:
          optionRef.current ??
          (typeof document !== 'undefined' ? document.getElementById(optionId) : null),
        disabled: isDisabled,
        textValue: textValue ?? (typeof children === 'string' ? children : undefined),
      })
    }
  }, [combobox, value, optionId, isDisabled, textValue, children])

  // Virtual option mounting & pending focus resolution
  React.useLayoutEffect(() => {
    if (context && context.pendingVirtualIndex === index && optionRef.current) {
      context.setPendingVirtualIndex(null)
      optionRef.current.focus()
    }
  }, [context, index])

  // Listbox option registration
  React.useEffect(() => {
    if (context?.registerOption) {
      return context.registerOption({
        value,
        id: optionId,
        index,
        disabled: isDisabled,
        textValue: textValue ?? (typeof children === 'string' ? children : undefined),
        ref: optionRef,
      })
    }
  }, [context, value, optionId, index, isDisabled, textValue, children])

  const isActiveInCombobox = combobox
    ? combobox.activeOptionId === optionId ||
      (combobox.activeValue === value &&
        (!combobox.activeOptionId || combobox.activeOptionId === optionId))
    : false

  const isActive = combobox ? isActiveInCombobox : isSelected

  // Tab stop computation
  let tabIndex = -1
  if (isDisabled || combobox) {
    tabIndex = -1
  } else if (context) {
    const activeVal = context.focusedValue ?? context.preferredTabValue
    tabIndex = activeVal === value ? 0 : -1
  }

  const handlePressStart = (e: React.SyntheticEvent<HTMLDivElement>) => {
    if (isDisabled) return
    // B-02: presses from portaled row content (Menu/Popover React-tree
    // children) or interactive in-row content (button/input/...) are not
    // option presses — same guard family as keydown below.
    if (!e.currentTarget.contains(e.target as Node)) return
    if (isInteractiveDescendant(e.target, e.currentTarget)) return
    if (combobox) {
      e.preventDefault()
      return
    }

    // LB-POINTER-01: Select at primary press down when no custom onClick handler is attached
    if (!onClick && !hasTriggeredPressRef.current) {
      hasTriggeredPressRef.current = true
      context?.selectOption(value)
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // LB-DOM-04 / LB-POINTER-04: disabled options are strictly inert — no
    // consumer activation, and the default (compatibility mouse events) is
    // suppressed so the press cannot start a focus/selection path.
    if (isDisabled) {
      e.preventDefault()
      return
    }
    onPointerDown?.(e)
    if (e.defaultPrevented) return
    if (e.button === 0 || e.pointerType === 'touch') {
      handlePressStart(e)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // LB-DOM-04: suppress the mousedown default so a pointer press on a
    // disabled option cannot move DOM focus to it (native disabled parity).
    if (isDisabled) {
      e.preventDefault()
      return
    }
    onMouseDown?.(e)
    if (e.defaultPrevented) return
    if (e.button === 0) {
      handlePressStart(e)
    }
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e)
    if (!isDisabled && combobox) {
      combobox.setActiveValue(value)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // LB-POINTER-04: a disabled option never runs consumer activation.
    if (isDisabled) {
      hasTriggeredPressRef.current = false
      return
    }
    onClick?.(e)
    if (e.defaultPrevented) {
      hasTriggeredPressRef.current = false
      return
    }
    // B-02: clicks from portaled row content bubble through the React tree
    // into this handler — without a DOM-containment check every menu action
    // re-toggles the row. In-row interactive content (a ⋯ Menu trigger)
    // must not select either.
    if (!e.currentTarget.contains(e.target as Node)) {
      hasTriggeredPressRef.current = false
      return
    }
    if (isInteractiveDescendant(e.target, e.currentTarget)) {
      hasTriggeredPressRef.current = false
      return
    }

    if (combobox) {
      combobox.handleSelect(value)
      return
    }

    if (hasTriggeredPressRef.current) {
      hasTriggeredPressRef.current = false
      return
    }

    context?.selectOption(value)
  }

  const handleKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDownCapture?.(e)
    // LB-KEY-06: Do NOT repurpose PageUp/PageDown
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.stopPropagation()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // B-02: keydowns from portaled row content are not this option's keys.
    if (!e.currentTarget.contains(e.target as Node)) return
    if (isInteractiveDescendant(e.target, e.currentTarget)) return

    // LB-POINTER-04: a disabled option never runs consumer activation —
    // not even for pass-through keys. Observation (focus landing on an
    // already-focused node) still reports via onFocus.
    if (isDisabled) return

    if (e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Escape' || e.key === 'Tab') {
      onKeyDown?.(e)
      return
    }

    onKeyDown?.(e)
    if (e.defaultPrevented) return

    // LB-KEY-06: modified activation stays with the browser/application —
    // Ctrl/Meta/Alt/Shift+Enter (or Space) must not select. Navigation keys
    // intentionally keep kernel parity (arrows move regardless of modifiers;
    // movement never selects, so LB-MULTI-05 still holds).
    const hasActivationModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey

    if (e.key === 'Enter') {
      if (hasActivationModifier) return
      e.preventDefault()
      if (context) {
        context.selectOption(value)
      } else if (combobox) {
        combobox.handleSelect(value)
      }
      return
    }

    if (e.key === ' ') {
      if (hasActivationModifier) return
      const hasBuffer = context?.typeaheadHasBuffer?.() ?? false
      if (!hasBuffer) {
        e.preventDefault()
        if (context) {
          context.selectOption(value)
        } else if (combobox) {
          combobox.handleSelect(value)
        }
      } else {
        e.preventDefault()
        e.stopPropagation()
        if (context?.virtual && index != null) {
          context.handleVirtualTypeahead(' ', index)
        } else if (context) {
          context.handleStandaloneTypeahead(' ', value)
        }
      }
      return
    }

    // Typeahead handling for printable characters (kernel entry guard;
    // Space routes through the buffer-aware branch above). The guard also
    // skips IME-composing keys, which previously fed the buffer.
    if (e.key !== ' ' && !shouldIgnoreTypeaheadKey(e)) {
      if (context?.virtual && index != null) {
        e.preventDefault()
        e.stopPropagation()
        context.handleVirtualTypeahead(e.key, index)
        return
      } else if (context) {
        e.preventDefault()
        e.stopPropagation()
        context.handleStandaloneTypeahead(e.key, value)
        return
      }
    }

    // Navigation handling
    if (context?.virtual && index != null) {
      context.navigateVirtual(e, index)
      return
    }

    if (context && optionRef.current) {
      context.navigateStandalone(e, optionRef.current)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(e)
    // LB-KEY-07: focus landing in an interactive descendant (input, button)
    // is the descendant's own focus — it must not promote the option to the
    // roving tab stop or the combobox active value.
    if (e.target !== e.currentTarget) return
    if (!isDisabled && context) {
      context.setFocusedValue(value)
    }
    if (!isDisabled && combobox) {
      combobox.setActiveValue(value)
    }
  }

  return (
    <Div
      ref={composedOptionRef}
      id={optionId}
      role="option"
      tabIndex={tabIndex}
      aria-selected={isSelected ? 'true' : 'false'}
      aria-disabled={isDisabled ? 'true' : undefined}
      aria-setsize={context?.virtual ? context.virtual.items.length : undefined}
      aria-posinset={context?.virtual && index != null ? index + 1 : undefined}
      data-state={isSelected ? 'selected' : 'unselected'}
      data-selected={isSelected ? '' : undefined}
      data-active={combobox ? (isActiveInCombobox ? '' : undefined) : isActive ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      data-value={value}
      onMouseDown={handleMouseDown}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerOver={handlePointerEnter}
      onMouseEnter={handlePointerEnter}
      onClick={handleClick}
      onKeyDownCapture={handleKeyDownCapture}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      display="flex"
      alignItems="center"
      justifyContent={combobox ? 'space-between' : undefined}
      minHeight={controlSize.height}
      height="auto"
      px="3r"
      py={controlSize.paddingBlock}
      boxSizing="border-box"
      borderRadius="sm"
      fontSize="3.5r"
      lineHeight="5r"
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      /* B-38: standalone selection uses the muted wash (Menu/Tree parity;
         ui.button.background renders near-white in dark mode). Combobox
         active-highlight keeps the paired button tokens (transient). */
      bg={
        isActive
          ? combobox
            ? 'ui.button.background'
            : 'ui.table.row.mutedBackground'
          : 'transparent'
      }
      color={
        isActive
          ? combobox
            ? 'ui.button.foreground'
            : 'design.text.base'
          : 'design.text.base'
      }
      opacity={isDisabled ? 0.5 : 1}
      outline="none"
      userSelect="none"
      _hover={
        combobox
          ? undefined
          : !isSelected && !isDisabled
            ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' }
            : undefined
      }
      _focus={
        combobox
          ? { outline: 'none', bg: 'ui.button.background', color: 'ui.button.foreground' }
          : undefined
      }
      _focusVisible={
        combobox
          ? { outline: 'none', bg: 'ui.button.background', color: 'ui.button.foreground' }
          : { outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '-2px' }
      }
      css={{
        '& .ref-span': {
          color: 'inherit',
        },
        '& [data-slot="check"], & [data-slot="check"] *': {
          color: 'inherit',
          fill: 'currentColor',
        },
        '& [data-slot="description"]': {
          opacity: isActive ? 0.75 : 0.65,
          fontSize: '3r',
          lineHeight: '4r',
        },
      }}
      className={className}
      style={{
        minHeight: controlHeightPx,
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {combobox ? (
        <>
          <Span
            flex="1"
            display="inline-flex"
            alignItems="center"
            minWidth="0"
            textAlign="start"
            color="inherit"
          >
            {children}
          </Span>
          {isSelected && (
            <Span
              data-slot="check"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              width="4r"
              height="4r"
              flexShrink={0}
              color="inherit"
            >
              <CheckIcon />
            </Span>
          )}
        </>
      ) : (
        children
      )}
    </Div>
  )
  }
)

export type ListboxOptionComponent = {
  <TValue extends string = string>(
    props: ListboxOptionProps<TValue> & React.RefAttributes<HTMLDivElement>
  ): React.ReactElement | null
}

// Public generic face over the string-typed forwardRef implementation.
export const ListboxOption = ListboxOptionBase as unknown as ListboxOptionComponent

export const ListboxComponentBase = React.forwardRef<HTMLDivElement, ListboxProps>(
  function Listbox(
    {
      children,
      selection = 'single',
      value: valueProp,
      onChange,
      orientation = 'vertical',
      virtual,
      disabled = false,
      tabIndex: tabIndexProp,
      className,
      style,
      ...props
    },
    ref
  ) {
    const combobox = React.useContext(ComboboxContext)

    // LB-CB-03: Yield commit authority to containing Combobox
    if (combobox && onChange) {
      throw new Error(
        'Reference UI: Listbox cannot have an onChange handler when used inside Combobox. Combobox owns selection authority.'
      )
    }

    const controlledValue = combobox
      ? combobox.value
      : valueProp !== undefined
        ? valueProp
        : selection === 'multiple'
          ? []
          : null

    const optionsMapRef = React.useRef<Map<string, OptionRecord>>(new Map())
    const [optionsVersion, setOptionsVersion] = React.useState(0)
    const [focusedValue, setFocusedValue] = React.useState<string | null>(null)
    const [pendingVirtualIndex, setPendingVirtualIndex] = React.useState<number | null>(null)
    const containerRef = React.useRef<HTMLDivElement | null>(null)

    // Reset focusedValue when controlled value updates (LB-SINGLE-07)
    React.useEffect(() => {
      setFocusedValue(null)
    }, [valueProp])

    // Render-time duplicate detection (id comparison: deterministic across
    // StrictMode and React 17/18 indeterminate double-renders; colliding
    // derived ids fall through to the commit-phase registerOption check below)
    const renderValuesMapRef = React.useRef<Map<string, string>>(new Map())
    renderValuesMapRef.current.clear()

    const registerRenderValue = React.useCallback((val: string, id: string) => {
      const existingId = renderValuesMapRef.current.get(val)
      if (existingId && existingId !== id) {
        throw new Error(
          `Reference UI: Duplicate option value "${val}". Option values must be unique.`
        )
      }
      renderValuesMapRef.current.set(val, id)
    }, [])

    // Live virtual adapter for registration-time validation (ref: registering
    // options must not re-subscribe when the adapter object identity changes).
    const virtualRef = React.useRef(virtual)
    virtualRef.current = virtual

    const registerOption = React.useCallback((record: OptionRecord) => {
      const existing = optionsMapRef.current.get(record.value)
      if (existing) {
        throw new Error(
          `Reference UI: Duplicate option value "${record.value}". Option values must be unique.`
        )
      }

      // LB-VIRT-09: validate an indexed mount against the live virtual adapter
      const liveVirtual = virtualRef.current
      if (liveVirtual && record.index != null) {
        const candidate = toMountedIndexEntries(optionsMapRef.current.values())
        candidate.push({ value: record.value, index: record.index, disabled: record.disabled })
        validateVirtualAdapter(liveVirtual, candidate)
      }

      optionsMapRef.current.set(record.value, record)
      setOptionsVersion(v => v + 1)

      return () => {
        optionsMapRef.current.delete(record.value)
        setOptionsVersion(v => v + 1)
      }
    }, [])

    const virtualItems = virtual?.items

    // LB-VIRT-09: re-validate mounted indexed options when logical items change.
    // An atomic adapter replacement also drops any pending target: the index
    // may name a different logical item under the new order, so the next
    // command must start from mounted intent, never a stale closure.
    React.useEffect(() => {
      const liveVirtual = virtualRef.current
      if (!liveVirtual || !virtualItems) return
      setPendingVirtualIndex(null)
      validateVirtualAdapter(liveVirtual, toMountedIndexEntries(optionsMapRef.current.values()))
    }, [virtualItems])

    const getOrderedOptions = React.useCallback((): OptionRecord[] => {
      const records = Array.from(optionsMapRef.current.values())
      return records
        .filter(rec => rec.ref.current && rec.ref.current.isConnected)
        .sort((a, b) => {
          const elA = a.ref.current!
          const elB = b.ref.current!
          const pos = elA.compareDocumentPosition(elB)
          if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
          if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
          return 0
        })
    }, [])

    // Preferred tab value determination (LB-DOM-08)
    const preferredTabValue = React.useMemo(() => {
      const ordered = getOrderedOptions()
      const enabled = ordered.filter(o => !o.disabled)

      if (selection === 'single') {
        if (typeof controlledValue === 'string') {
          const matching = enabled.find(o => o.value === controlledValue)
          if (matching) return matching.value
        }
      } else if (Array.isArray(controlledValue)) {
        const matching = enabled.find(o => controlledValue.includes(o.value))
        if (matching) return matching.value
      }

      return enabled.length > 0 ? enabled[0].value : null
    }, [getOrderedOptions, selection, controlledValue, optionsVersion])

    // LB-DYNAMIC-02 & LB-DYNAMIC-04: Deterministic focus recovery
    const lastOrderedValuesRef = React.useRef<string[]>([])

    React.useEffect(() => {
      const ordered = getOrderedOptions()
      const currentValues = ordered.map(o => o.value)

      // LB-VIRT-06: a pending virtual target owns focus — the mounted set
      // legitimately lacks it until the window lands. Never recover over it.
      if (virtual && pendingVirtualIndex != null) {
        lastOrderedValuesRef.current = currentValues
        return
      }

      if (focusedValue != null) {
        const currentRecord = ordered.find(o => o.value === focusedValue)

        if (!currentRecord || currentRecord.disabled) {
          const oldIndex = lastOrderedValuesRef.current.indexOf(focusedValue)
          let nextTarget: OptionRecord | undefined

          if (oldIndex !== -1) {
            // First search forward in lastOrderedValues for the nearest enabled option in ordered
            for (let i = oldIndex + 1; i < lastOrderedValuesRef.current.length; i++) {
              const val = lastOrderedValuesRef.current[i]
              const rec = ordered.find(o => o.value === val && !o.disabled)
              if (rec) {
                nextTarget = rec
                break
              }
            }
            // If no forward target, search backward
            if (!nextTarget) {
              for (let i = oldIndex - 1; i >= 0; i--) {
                const val = lastOrderedValuesRef.current[i]
                const rec = ordered.find(o => o.value === val && !o.disabled)
                if (rec) {
                  nextTarget = rec
                  break
                }
              }
            }
          }

          if (!nextTarget) {
            nextTarget = ordered.find(o => !o.disabled)
          }

          if (nextTarget) {
            setFocusedValue(nextTarget.value)
            nextTarget.ref.current?.focus()
          } else {
            setFocusedValue(null)
          }
        } else if (
          typeof document !== 'undefined' &&
          (document.activeElement === null || document.activeElement === document.body)
        ) {
          // LB-GROUP-04: the focused value survived (moved between native
          // groups, same identity) but its DOM node detached and focus fell
          // to body — restore DOM focus to the same value. Only when focus
          // has nowhere else to be; never steal from elsewhere.
          currentRecord.ref.current?.focus()
        }
      }

      lastOrderedValuesRef.current = currentValues
    }, [optionsVersion, focusedValue, getOrderedOptions, virtual, pendingVirtualIndex])

    const isOptionSelected = React.useCallback(
      (val: string) => {
        if (selection === 'single') {
          return controlledValue === val
        }
        return Array.isArray(controlledValue) && controlledValue.includes(val)
      },
      [selection, controlledValue]
    )

    const selectOption = React.useCallback(
      (val: string) => {
        if (combobox) {
          combobox.handleSelect(val)
          return
        }

        if (selection === 'single') {
          // LB-SINGLE-05: Activating already-selected option is a no-op
          if (controlledValue === val) return
          onChange?.(val as any)
        } else {
          const orderedKnown = virtual
            ? virtual.items.map((i: VirtualFocusItem) => i.value)
            : getOrderedOptions().map(o => o.value)
          const nextValues = computeNextMultipleSelection(controlledValue, val, orderedKnown)
          onChange?.(nextValues as any)
        }
      },
      [selection, controlledValue, combobox, onChange, virtual, getOrderedOptions]
    )

    // Standalone live-DOM navigation (handles dynamic reorders LB-DYNAMIC-01)
    const navigateStandalone = React.useCallback(
      (e: React.KeyboardEvent<HTMLElement>, currentEl: HTMLElement) => {
        if (!containerRef.current) return
        const allOptionEls = Array.from(
          containerRef.current.querySelectorAll<HTMLDivElement>('[role="option"]:not([aria-disabled="true"])')
        )
        if (allOptionEls.length === 0) return

        const currentIndex = allOptionEls.indexOf(currentEl as HTMLDivElement)
        if (currentIndex === -1) return

        const isRtl = getDirection(containerRef.current) === 'rtl'
        let targetIndex = currentIndex

        if (orientation === 'vertical') {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            e.stopPropagation()
            targetIndex = (currentIndex + 1) % allOptionEls.length
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            e.stopPropagation()
            targetIndex = (currentIndex - 1 + allOptionEls.length) % allOptionEls.length
          }
        } else if (orientation === 'horizontal') {
          const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
          const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
          if (e.key === nextKey) {
            e.preventDefault()
            e.stopPropagation()
            targetIndex = (currentIndex + 1) % allOptionEls.length
          } else if (e.key === prevKey) {
            e.preventDefault()
            e.stopPropagation()
            targetIndex = (currentIndex - 1 + allOptionEls.length) % allOptionEls.length
          }
        }

        if (e.key === 'Home') {
          e.preventDefault()
          e.stopPropagation()
          targetIndex = 0
        } else if (e.key === 'End') {
          e.preventDefault()
          e.stopPropagation()
          targetIndex = allOptionEls.length - 1
        }

        if (targetIndex !== currentIndex && allOptionEls[targetIndex]) {
          const targetEl = allOptionEls[targetIndex]
          const val = targetEl.getAttribute('data-value')
          setFocusedValue(val)
          targetEl.focus()
        }
      },
      [orientation]
    )

    // Virtual Navigation (handles coalescing LB-VIRT-06)
    const navigateVirtual = React.useCallback(
      (e: React.KeyboardEvent<HTMLElement>, currentIndex: number) => {
        if (!virtual) return
        const items = virtual.items
        if (items.length === 0) return

        const isRtl = getDirection(containerRef.current) === 'rtl'
        // Coalesce rapid navigation from pending target
        const effectiveIndex = pendingVirtualIndex ?? currentIndex
        let targetIndex = effectiveIndex

        if (orientation === 'vertical') {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            e.stopPropagation()
            for (let step = 1; step <= items.length; step++) {
              const idx = (effectiveIndex + step) % items.length
              if (!items[idx].disabled) {
                targetIndex = idx
                break
              }
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            e.stopPropagation()
            for (let step = 1; step <= items.length; step++) {
              const idx = (effectiveIndex - step + items.length) % items.length
              if (!items[idx].disabled) {
                targetIndex = idx
                break
              }
            }
          }
        } else if (orientation === 'horizontal') {
          const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
          const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
          if (e.key === nextKey) {
            e.preventDefault()
            e.stopPropagation()
            for (let step = 1; step <= items.length; step++) {
              const idx = (effectiveIndex + step) % items.length
              if (!items[idx].disabled) {
                targetIndex = idx
                break
              }
            }
          } else if (e.key === prevKey) {
            e.preventDefault()
            e.stopPropagation()
            for (let step = 1; step <= items.length; step++) {
              const idx = (effectiveIndex - step + items.length) % items.length
              if (!items[idx].disabled) {
                targetIndex = idx
                break
              }
            }
          }
        }

        if (e.key === 'Home') {
          e.preventDefault()
          e.stopPropagation()
          const first = items.findIndex((i: VirtualFocusItem) => !i.disabled)
          if (first !== -1) targetIndex = first
        } else if (e.key === 'End') {
          e.preventDefault()
          e.stopPropagation()
          for (let i = items.length - 1; i >= 0; i--) {
            if (!items[i].disabled) {
              targetIndex = i
              break
            }
          }
        }

        if (targetIndex !== effectiveIndex) {
          setFocusedValue(items[targetIndex].value)
          const mounted = optionsMapRef.current.get(items[targetIndex].value)
          if (mounted?.ref.current && mounted.ref.current.isConnected) {
            setPendingVirtualIndex(null)
            mounted.ref.current.focus()
          } else {
            setPendingVirtualIndex(targetIndex)
            virtual.scrollToIndex(targetIndex)
          }
        }
      },
      [virtual, orientation, pendingVirtualIndex]
    )

    // Typeahead Model
    const typeaheadBufferRef = React.useRef('')
    const typeaheadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const collator = React.useMemo(
      () => new Intl.Collator(undefined, { sensitivity: 'accent', usage: 'search' }),
      []
    )

    const typeaheadHasBuffer = React.useCallback(() => {
      return typeaheadBufferRef.current.length > 0
    }, [])

    const handleStandaloneTypeahead = React.useCallback(
      (char: string, currentValue: string) => {
        if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current)
        typeaheadTimerRef.current = setTimeout(() => {
          typeaheadBufferRef.current = ''
        }, 1000)

        const ordered = getOrderedOptions().filter(o => !o.disabled)
        if (ordered.length === 0) return

        const currentIdx = ordered.findIndex(o => o.value === currentValue)
        const currentItemText = currentIdx !== -1 ? (ordered[currentIdx].textValue || ordered[currentIdx].value) : ''
        const isCurrentStartingWithChar =
          currentItemText.length > 0 &&
          collator.compare(currentItemText.slice(0, char.length), char) === 0

        let match: OptionRecord | undefined
        const isRepeatChar =
          char.length === 1 &&
          typeaheadBufferRef.current.length > 0 &&
          typeaheadBufferRef.current.split('').every(c => collator.compare(c, char) === 0)

        const isCycle =
          isRepeatChar ||
          (typeaheadBufferRef.current.length === 0 && isCurrentStartingWithChar)

        // If repeat character or (buffer was empty and current already starts with char), advance to next match (LB-KEY-04)
        if (isCycle) {
          typeaheadBufferRef.current = char
          // Search starting after currentIdx
          const reordered = [
            ...ordered.slice(currentIdx + 1),
            ...ordered.slice(0, currentIdx + 1),
          ]
          match = reordered.find(item => {
            const text = item.textValue || item.value
            return (
              text.length >= char.length &&
              collator.compare(text.slice(0, char.length), char) === 0
            )
          })
        } else {
          typeaheadBufferRef.current += char
          const query = typeaheadBufferRef.current
          const startIdx = currentIdx !== -1 ? currentIdx : 0
          const reordered = [
            ...ordered.slice(startIdx),
            ...ordered.slice(0, startIdx),
          ]
          match = reordered.find(item => {
            const text = item.textValue || item.value
            return (
              text.length >= query.length &&
              collator.compare(text.slice(0, query.length), query) === 0
            )
          })
        }

        if (match && match.ref.current) {
          setFocusedValue(match.value)
          match.ref.current.focus()
        }
      },
      [getOrderedOptions, collator]
    )

    const handleVirtualTypeahead = React.useCallback(
      (char: string, currentIndex: number) => {
        if (!virtual) return
        const items = virtual.items
        if (items.length === 0) return

        if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current)
        typeaheadTimerRef.current = setTimeout(() => {
          typeaheadBufferRef.current = ''
        }, 1000)

        const currentItem = items[currentIndex]
        const currentItemText = currentItem ? (currentItem.textValue || currentItem.value) : ''
        const isCurrentStartingWithChar =
          currentItemText.length > 0 &&
          collator.compare(currentItemText.slice(0, char.length), char) === 0

        const isRepeatChar =
          char.length === 1 &&
          typeaheadBufferRef.current.length > 0 &&
          typeaheadBufferRef.current.split('').every(c => collator.compare(c, char) === 0)

        const isCycle =
          isRepeatChar ||
          (typeaheadBufferRef.current.length === 0 && isCurrentStartingWithChar)

        const enabledIndices: number[] = []
        items.forEach((item: VirtualFocusItem, idx: number) => {
          if (!item.disabled) enabledIndices.push(idx)
        })

        let matchIndex: number | undefined

        if (isCycle) {
          typeaheadBufferRef.current = char
          const reordered = [
            ...enabledIndices.filter(i => i > currentIndex),
            ...enabledIndices.filter(i => i <= currentIndex),
          ]
          matchIndex = reordered.find(idx => {
            const item = items[idx]
            const text = item.textValue || item.value
            return (
              text.length >= char.length &&
              collator.compare(text.slice(0, char.length), char) === 0
            )
          })
        } else {
          typeaheadBufferRef.current += char
          const query = typeaheadBufferRef.current
          const reordered = [
            ...enabledIndices.filter(i => i >= currentIndex),
            ...enabledIndices.filter(i => i < currentIndex),
          ]
          matchIndex = reordered.find(idx => {
            const item = items[idx]
            const text = item.textValue || item.value
            return (
              text.length >= query.length &&
              collator.compare(text.slice(0, query.length), query) === 0
            )
          })
        }

        if (matchIndex != null) {
          setFocusedValue(items[matchIndex].value)
          const mounted = optionsMapRef.current.get(items[matchIndex].value)
          if (mounted?.ref.current && mounted.ref.current.isConnected) {
            setPendingVirtualIndex(null)
            mounted.ref.current.focus()
          } else {
            setPendingVirtualIndex(matchIndex)
            virtual.scrollToIndex(matchIndex)
          }
        }
      },
      [virtual, collator]
    )

    // LB-VIRT-10: no unmount cleanup needed — the pending virtual target is
    // plain component state, so unmount discards it inherently. (A setState
    // cleanup here would warn on React 17; there is no timer or rAF to kill.)

    const contextValue = React.useMemo<ListboxContextValue>(
      () => ({
        selection,
        orientation,
        value: controlledValue,
        disabled,
        isOptionSelected,
        selectOption,
        virtual,
        focusedValue,
        setFocusedValue,
        preferredTabValue,
        registerOption,
        registerRenderValue,
        getOrderedOptions,
        typeaheadHasBuffer,
        handleStandaloneTypeahead,
        handleVirtualTypeahead,
        pendingVirtualIndex,
        setPendingVirtualIndex,
        navigateVirtual,
        navigateStandalone,
      }),
      [
        selection,
        orientation,
        controlledValue,
        disabled,
        isOptionSelected,
        selectOption,
        virtual,
        combobox,
        focusedValue,
        preferredTabValue,
        registerOption,
        registerRenderValue,
        getOrderedOptions,
        typeaheadHasBuffer,
        handleStandaloneTypeahead,
        handleVirtualTypeahead,
        pendingVirtualIndex,
        navigateVirtual,
        navigateStandalone,
      ]
    )

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      props.onMouseLeave?.(e)
      if (combobox) {
        combobox.setActiveValue(combobox.value ?? null)
      }
    }

    const composedRef = (node: HTMLDivElement | null) => {
      containerRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    }

    // Determine root tabIndex (LB-DOM-07)
    const optionsCount = optionsMapRef.current.size
    const rootTabIndex = optionsCount === 0 ? tabIndexProp : undefined

    return (
      <ListboxContext.Provider value={contextValue}>
        <Div
          ref={composedRef}
          role="listbox"
          aria-orientation={orientation}
          aria-multiselectable={selection === 'multiple' ? 'true' : undefined}
          data-orientation={orientation}
          data-reference-listbox=""
          data-disabled={disabled ? '' : undefined}
          tabIndex={rootTabIndex}
          display="flex"
          flexDirection={orientation === 'vertical' ? 'column' : 'row'}
          gap="0.5r"
          outline="none"
          onMouseLeave={handleMouseLeave}
          onPointerLeave={handleMouseLeave}
          p={combobox ? '0' : '1r'}
          bg={combobox ? 'transparent' : 'ui.dialog.background'}
          color={combobox ? 'inherit' : 'ui.dialog.foreground'}
          borderRadius={combobox ? undefined : 'md'}
          border={combobox ? undefined : '1px solid'}
          borderColor={combobox ? undefined : 'ui.dialog.border'}
          boxShadow={combobox ? undefined : '0 4px 16px rgba(0,0,0,0.12)'}
          className={className}
          style={style}
          {...props}
        >
          {children}
        </Div>
      </ListboxContext.Provider>
    )
  }
)

export type ListboxSectionProps = PrimitiveProps<'div'> & {
  title?: React.ReactNode
}

export function ListboxSection({
  title,
  children,
  className,
  style,
  ...props
}: ListboxSectionProps) {
  const headingId = React.useId()
  return (
    <Div
      role="group"
      aria-labelledby={title ? headingId : undefined}
      data-reference-listbox-section=""
      display="flex"
      flexDirection="column"
      gap="0.5r"
      py="1r"
      className={className}
      style={style}
      {...props}
    >
      {title && (
        <Span
          id={headingId}
          data-reference-listbox-header=""
          display="block"
          px="3r"
          py="1r"
          fontSize="2.75r"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="0.05em"
          color="design.text.light"
          userSelect="none"
        >
          {title}
        </Span>
      )}
      {children}
    </Div>
  )
}

export type ListboxHeaderProps = PrimitiveProps<'span'>

export function ListboxHeader({
  children,
  className,
  style,
  ...props
}: ListboxHeaderProps) {
  return (
    <Span
      data-reference-listbox-header=""
      display="block"
      px="3r"
      py="1r"
      fontSize="2.75r"
      fontWeight="600"
      textTransform="uppercase"
      letterSpacing="0.05em"
      color="design.text.light"
      userSelect="none"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Span>
  )
}

export type ListboxEmptyProps = PrimitiveProps<'div'>

export function ListboxEmpty({
  children = 'No results found',
  className,
  style,
  ...props
}: ListboxEmptyProps) {
  return (
    <Div
      data-reference-listbox-empty=""
      role="status"
      aria-live="polite"
      px="3r"
      py="3r"
      fontSize="3.5r"
      color="design.text.light"
      textAlign="center"
      userSelect="none"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Div>
  )
}

export type ListboxComponent = {
  <TValue extends string = string>(
    props: ListboxProps<TValue> & React.RefAttributes<HTMLDivElement>
  ): React.ReactElement | null
  Option: typeof ListboxOption
  Section: typeof ListboxSection
  Header: typeof ListboxHeader
  Empty: typeof ListboxEmpty
}

// Public generic face over the string-typed forwardRef implementation:
// TValue infers per use site (literals narrow, default string); internals
// erase to string since TValue extends string. Runtime untouched.
export const Listbox = ListboxComponentBase as unknown as ListboxComponent
Listbox.Option = ListboxOption
Listbox.Section = ListboxSection
Listbox.Header = ListboxHeader
Listbox.Empty = ListboxEmpty

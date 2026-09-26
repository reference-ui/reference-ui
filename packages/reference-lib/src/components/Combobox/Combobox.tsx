import * as React from 'react'
import { Input, Button, type PrimitiveProps } from '@reference-ui/react'
import { Overlay, useOverlay, type OverlayContentProps } from '../Overlay'
import {
  ListboxOption,
  ListboxSection,
  ListboxEmpty,
  type ListboxOptionProps,
} from '../Listbox'
import {
  ComboboxContext,
  shadowContainerForSource,
  type ComboboxActiveSource,
  type ComboboxContextValue,
  type ComboboxOptionEntry,
} from './combobox-context'
import { TypeaheadModel, shouldIgnoreTypeaheadKey } from '../RovingFocus/typeahead'

// The package declares no node types, so the bare `process` global is
// unresolvable in the narrow build program — read it through globalThis
// with a file-local shape instead. Same pattern as Overlay's warn helper.
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

export function comboboxDiagnostic(message: string) {
  const isProd = globalProcess?.env?.NODE_ENV === 'production'
  if (!isProd) {
    console.error(`[reference-ui] Combobox: ${message}`)
  }
}

function sanitizeComboboxId(rawId: string) {
  return `ref-cb-pop-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/**
 * Shared arrow-step for Input and Trigger (#8/#9): wraps through enabled
 * logical options, tags the result keyboard-derived, and scrolls it into
 * view inside the popover without moving DOM focus or the page.
 */
function stepActiveValue(args: {
  enabled: ComboboxOptionEntry[]
  current: string | null
  direction: 1 | -1
  setActive: (val: string, source: 'keyboard') => void
}) {
  const { enabled, current, direction, setActive } = args
  if (enabled.length === 0) return
  const currentIndex = enabled.findIndex(opt => opt.value === current)
  let nextIndex: number
  if (currentIndex === -1) {
    nextIndex = direction === 1 ? 0 : enabled.length - 1
  } else {
    nextIndex = (currentIndex + direction + enabled.length) % enabled.length
  }
  const next = enabled[nextIndex]
  if (next) {
    setActive(next.value, 'keyboard')
    next.node?.scrollIntoView({ block: 'nearest' })
  }
}

/** Still-mounted check (CB-NAV-07): only a connected option may commit. */
function mountedValue(
  activeValue: string | null,
  enabled: ComboboxOptionEntry[]
): string | null {
  return activeValue != null && enabled.some(opt => opt.value === activeValue)
    ? activeValue
    : null
}

export interface ComboboxProps {
  children?: React.ReactNode
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
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
}

export type ComboboxInputProps = Omit<PrimitiveProps<'input'>, 'value' | 'defaultValue'> & {
  value?: never
  defaultValue?: never
}

export const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  function ComboboxInput(
    {
      value: forbiddenValue,
      defaultValue: forbiddenDefaultValue,
      onChange,
      onClick,
      onKeyDown,
      onFocus,
      onBlur,
      onCompositionStart,
      onCompositionEnd,
      disabled: disabledProp,
      readOnly,
      className,
      style,
      ...props
    }: ComboboxInputProps,
    userRef
  ) {
  const rawProps = { value: forbiddenValue, defaultValue: forbiddenDefaultValue }
  if (rawProps.value !== undefined || rawProps.defaultValue !== undefined) {
    comboboxDiagnostic(
      'Combobox.Input does not accept value or defaultValue. Use root inputValue and onInputValueChange.'
    )
  }

  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const isComposingRef = React.useRef(false)
  const sourceRef = context?.sourceRef
  const inputValue = context?.inputValue ?? ''
  const isOpen = context?.isOpen ?? false
  const disabled = context?.disabled ?? false
  const setIsOpen = context?.setIsOpen
  const handleInputChange = context?.handleInputChange
  const popoverId = context?.popoverId
  const registerFocusSource = context?.registerFocusSource

  const assignAnchor = React.useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      const host = (node?.closest('[data-reference-field]') as HTMLElement | null) ?? node
      if (sourceRef) sourceRef.current = host
      if (overlay) overlay.triggerRef.current = host
    },
    [overlay, sourceRef]
  )

  const composedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      assignAnchor(node)
      if (typeof userRef === 'function') {
        userRef(node)
      } else if (userRef && 'current' in userRef) {
        ;(userRef as React.MutableRefObject<HTMLInputElement | null>).current = node
      }
    },
    [assignAnchor, userRef]
  )

  React.useLayoutEffect(() => {
    assignAnchor(inputRef.current)
  })

  React.useLayoutEffect(() => {
    if (registerFocusSource) return registerFocusSource('input')
  }, [registerFocusSource])

  if (!context || !setIsOpen || !handleInputChange) return null

  const isDisabled = disabled || disabledProp
  const isReadOnly = Boolean(readOnly)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    if (!e.defaultPrevented && !isDisabled && !isReadOnly) {
      handleInputChange(e.target.value)
      if (!isOpen) setIsOpen(true)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && !isReadOnly && !isOpen) {
      setIsOpen(true)
    }
  }

  // #11: focus alone never opens. Deliberate open comes only from
  // arrows, real edits under the content gate, and Trigger activation.
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e)
  }

  // #3: blur is not cancelable, so the consumer handler observes only;
  // outside-focus commit-or-revert + dismissal always runs.
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e)
    if (!isDisabled) {
      context.handleSourceBlur(e.relatedTarget)
    }
  }

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    onCompositionStart?.(e)
    isComposingRef.current = true
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    onCompositionEnd?.(e)
    isComposingRef.current = false
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled || isReadOnly) return
    // IME composition owns the key: take no action and shield the
    // document-level Overlay Escape listener, while leaving the native
    // default (composition cancel) untouched (CB-EDIT-05/09).
    if (
      isComposingRef.current ||
      e.key === 'Process' ||
      e.nativeEvent.isComposing ||
      (e.nativeEvent as KeyboardEvent).keyCode === 229
    ) {
      e.stopPropagation()
      return
    }

    const enabled = context.getOrderedOptions().filter(opt => !opt.disabled)

    // The active value can go stale when its option unmounts (dynamic
    // collections); only a still-mounted option may commit (CB-NAV-07).
    const mountedActiveValue = mountedValue(context.activeValue, enabled)
    // #9: Tab commits keyboard-derived active only — never a stale
    // pointer preview (CB-COMMIT-04 narrows vendor Shift+Tab behavior).
    const keyboardActiveValue =
      context.activeSource === 'keyboard' ? mountedActiveValue : null

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        context.requestArrowOpen(1)
      } else {
        stepActiveValue({
          enabled,
          current: context.activeValue,
          direction: 1,
          setActive: context.setActiveValue,
        })
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        context.requestArrowOpen(-1)
      } else {
        stepActiveValue({
          enabled,
          current: context.activeValue,
          direction: -1,
          setActive: context.setActiveValue,
        })
      }
    } else if (e.key === 'Enter') {
      if (isOpen && mountedActiveValue != null) {
        e.preventDefault()
        context.handleSelect(mountedActiveValue)
      }
    } else if (e.key === 'Tab') {
      // Native traversal is never prevented. With no keyboard-eligible
      // active option the session reverts and closes instead of committing
      // (CB-COMMIT-05); closed popups leave Tab entirely native (CB-COMMIT-09).
      if (isOpen) {
        if (keyboardActiveValue != null) {
          context.handleSelect(keyboardActiveValue)
        } else {
          context.revertToCommittedText()
          context.setActiveValue(null)
          setIsOpen(false)
        }
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        context.revertToCommittedText()
        context.setActiveValue(null)
        setIsOpen(false)
      }
    }
  }

  return (
    <Input
      {...props}
      ref={composedRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-controls={popoverId}
      aria-activedescendant={isOpen ? (context.activeOptionId ?? undefined) : undefined}
      disabled={isDisabled}
      readOnly={readOnly}
      value={inputValue}
      onChange={handleChange}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={className}
      style={style}
    />
  )
  }
)

export type ComboboxTriggerProps = PrimitiveProps<'button'>

export const ComboboxTrigger = React.forwardRef<HTMLButtonElement, ComboboxTriggerProps>(
  function ComboboxTrigger(
    {
      children,
      onClick,
      onKeyDown,
      onBlur,
      disabled: disabledProp,
      className,
      style,
      ...props
    }: ComboboxTriggerProps,
    userRef
  ) {
  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const registerFocusSource = context?.registerFocusSource
  // #8: select-only typeahead buffer (Downshift useSelect parity: 500ms).
  const typeaheadRef = React.useRef<TypeaheadModel | null>(null)
  if (typeaheadRef.current === null) {
    typeaheadRef.current = new TypeaheadModel({ timeoutMs: 500 })
  }

  React.useLayoutEffect(() => {
    if (registerFocusSource) return registerFocusSource('trigger')
  }, [registerFocusSource])

  React.useEffect(() => {
    const model = typeaheadRef.current
    return () => model?.reset()
  }, [])

  if (!context) return null

  const composedRef = (node: HTMLButtonElement | null) => {
    context.sourceRef.current = node
    if (overlay) overlay.triggerRef.current = node
    if (typeof userRef === 'function') {
      userRef(node)
    } else if (userRef && 'current' in userRef) {
      ;(userRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }
  }

  const isDisabled = context.disabled || disabledProp

  // Pointer path: native activation toggles (CB-OPEN-04). Keyboard commit
  // is decided in keydown below, which suppresses the native click so the
  // two paths never double-fire (CB-SELECT-04).
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      context.setIsOpen(!context.isOpen)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    onBlur?.(e)
    if (!isDisabled) {
      context.handleSourceBlur(e.relatedTarget)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented || isDisabled) return
    const enabled = context.getOrderedOptions().filter(opt => !opt.disabled)
    const mountedActiveValue = mountedValue(context.activeValue, enabled)
    const keyboardActiveValue =
      context.activeSource === 'keyboard' ? mountedActiveValue : null

    const activateFirstLast = (which: 'first' | 'last') => {
      const target = which === 'first' ? enabled[0] : enabled[enabled.length - 1]
      if (target) {
        e.preventDefault()
        context.setActiveValue(target.value, 'keyboard')
        target.node?.scrollIntoView({ block: 'nearest' })
      }
    }

    // Enter/Space decide in keydown (preventing the native click):
    // closed opens, open-with-active commits, open-without-active closes.
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      if (!context.isOpen) {
        context.setIsOpen(true)
      } else if (mountedActiveValue != null) {
        context.handleSelect(mountedActiveValue)
      } else {
        context.setActiveValue(null)
        context.setIsOpen(false)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!context.isOpen) {
        context.requestArrowOpen(1)
      } else {
        stepActiveValue({
          enabled,
          current: context.activeValue,
          direction: 1,
          setActive: context.setActiveValue,
        })
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!context.isOpen) {
        context.requestArrowOpen(-1)
      } else {
        stepActiveValue({
          enabled,
          current: context.activeValue,
          direction: -1,
          setActive: context.setActiveValue,
        })
      }
      return
    }

    // #13: select-only mirror — Escape/Tab close with a value commit or
    // no-commit, native focus, cleared active ID, and zero text callbacks.
    if (e.key === 'Escape') {
      if (context.isOpen) {
        e.preventDefault()
        context.setActiveValue(null)
        context.setIsOpen(false)
      }
      return
    }

    if (e.key === 'Tab') {
      if (context.isOpen) {
        if (keyboardActiveValue != null) {
          context.handleSelect(keyboardActiveValue)
        } else {
          context.setActiveValue(null)
          context.setIsOpen(false)
        }
      }
      return
    }

    if (e.key === 'Home') {
      if (context.isOpen) activateFirstLast('first')
      return
    }

    if (e.key === 'End') {
      if (context.isOpen) activateFirstLast('last')
      return
    }

    // #8: printable typeahead opens when closed, then cycles enabled
    // matches; focus stays on Trigger and nothing commits until activation.
    if (!shouldIgnoreTypeaheadKey(e)) {
      const model = typeaheadRef.current
      if (!model) return
      if (!context.isOpen) {
        context.setIsOpen(true)
        return
      }
      const match = model.handleKey(
        e.key,
        context.activeValue,
        enabled.map(opt => ({
          id: opt.value,
          text: opt.textValue ?? opt.value,
        }))
      )
      if (match != null && match !== context.activeValue) {
        context.setActiveValue(match, 'keyboard')
        enabled.find(opt => opt.value === match)?.node?.scrollIntoView({ block: 'nearest' })
      }
    }
  }

  return (
    <Button
      {...props}
      ref={composedRef}
      type="button"
      role="combobox"
      aria-expanded={context.isOpen}
      aria-haspopup="listbox"
      aria-controls={context.popoverId}
      aria-activedescendant={context.isOpen ? (context.activeOptionId ?? undefined) : undefined}
      disabled={isDisabled}
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`ref-input ${className || ''}`}
      style={style}
    >
      {children}
    </Button>
  )
  }
)

export type ComboboxPopoverProps = OverlayContentProps

export function ComboboxPopover({
  children,
  style,
  id: idProp,
  onMouseLeave,
  onPointerLeave,
  onMouseDown,
  ...props
}: ComboboxPopoverProps) {
  const context = React.useContext(ComboboxContext)
  const overlay = useOverlay()
  const registerPopover = context?.registerPopover

  React.useLayoutEffect(() => {
    if (registerPopover) return registerPopover(idProp)
  }, [registerPopover, idProp])

  // #9: leaving the popover clears pointer-derived active only (Combobox
  // half of the joint seam; Listbox root leave targets the same state).
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(e)
    context?.clearPointerActive()
  }
  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e)
    context?.clearPointerActive()
  }

  // #3: mousedown inside the popover (chrome, scrollbars) must not move
  // focus — otherwise blur fires with a null relatedTarget and a true
  // inside gesture reads as outside. Options already prevent their own
  // press; clicks still dispatch.
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseDown?.(e)
    if (!e.defaultPrevented) {
      e.preventDefault()
    }
  }

  // PATCHES #1 (CB-ENV-03): when the focus source lives in an open
  // ShadowRoot, portal the popover into that same root. Light-DOM
  // sources leave the default body destination untouched.
  const sourceRef = context?.sourceRef
  const popoverOpen = context?.isOpen
  React.useLayoutEffect(() => {
    const container = shadowContainerForSource(sourceRef?.current)
    if (container) overlay?.setPortalContainer(container)
  }, [overlay, sourceRef, popoverOpen])

  const id = idProp ?? context?.popoverId

  return (
    <Overlay.Content
      data-reference-combobox-popover=""
      role="presentation"
      placement="bottom-start"
      p="1r"
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      border="1px solid"
      borderColor="ui.dialog.border"
      boxShadow="0 4px 16px rgba(0,0,0,0.12)"
      id={id}
      style={{
        minWidth: 'var(--reference-overlay-anchor-width, 12.5rem)',
        ...style,
      }}
      {...props}
      onMouseLeave={handleMouseLeave}
      onPointerLeave={handlePointerLeave}
      onMouseDown={handleMouseDown}
    >
      {children}
    </Overlay.Content>
  )
}

export function ComboboxOption(props: ListboxOptionProps) {
  return <ListboxOption {...props} />
}

export function Combobox({
  children,
  value: valueProp,
  defaultValue = null,
  onChange,
  inputValue: inputValProp,
  defaultInputValue,
  onInputValueChange,
  onInputChange,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onDismiss,
  onOpenChange,
  disabled = false,
  closeOnBlur = true,
}: ComboboxProps) {
  const isControlledValue = valueProp !== undefined
  const [internalValue, setInternalValue] = React.useState<string | null>(defaultValue)
  const value = isControlledValue ? valueProp : internalValue

  const isControlledInput = inputValProp !== undefined
  const [internalInput, setInternalInput] = React.useState<string>(
    () => defaultInputValue ?? (value ? String(value) : '')
  )
  const inputValue = isControlledInput ? inputValProp : internalInput

  const isControlledOpen = openProp !== undefined
  const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen)
  const isOpen = isControlledOpen ? openProp : internalOpen
  const sourceRef = React.useRef<HTMLElement | null>(null)

  const rawDefaultPopoverId = React.useId()
  const [popoverId, setPopoverId] = React.useState<string>(() =>
    sanitizeComboboxId(rawDefaultPopoverId)
  )
  const focusSourcesCountRef = React.useRef(0)
  const popoverCountRef = React.useRef(0)

  const [activeValue, setActiveValueState] = React.useState<string | null>(value ?? null)
  const [activeSource, setActiveSourceState] = React.useState<ComboboxActiveSource>(null)
  const activeSourceRef = React.useRef<ComboboxActiveSource>(null)
  // Opening direction captured by closed-source arrows (#8, CB-OPEN-02):
  // with no valid selection, Down pends first enabled, Up pends last.
  const pendingDirectionRef = React.useRef<1 | -1 | null>(null)
  const optionsMapRef = React.useRef<Map<string, ComboboxOptionEntry>>(new Map())
  // Registration mutates the map (no render on its own), so each
  // register/unregister also bumps a version to recompute the mounted-only
  // active ID. The bump carries no data — the map is still the source.
  const [optionsVersion, setOptionsVersion] = React.useState(0)

  const registerOption = React.useCallback((entry: ComboboxOptionEntry) => {
    optionsMapRef.current.set(entry.value, entry)
    setOptionsVersion(v => v + 1)
    return () => {
      optionsMapRef.current.delete(entry.value)
      setOptionsVersion(v => v + 1)
    }
  }, [])

  const getOrderedOptions = React.useCallback((): ComboboxOptionEntry[] => {
    const entries = Array.from(optionsMapRef.current.values())
    return entries
      .filter(entry => entry.node && entry.node.isConnected)
      .sort((a, b) => {
        const pos = a.node!.compareDocumentPosition(b.node!)
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
        return 0
      })
  }, [])

  // #13: the registered focus-source type decides select-only mode.
  // Under the exactly-one-source invariant last-wins is exact.
  const focusSourcesRef = React.useRef(new Set<'input' | 'trigger'>())
  const [focusSource, setFocusSource] = React.useState<'input' | 'trigger' | null>(null)
  const selectOnly = focusSource === 'trigger'

  const registerFocusSource = React.useCallback((type: 'input' | 'trigger') => {
    focusSourcesRef.current.add(type)
    focusSourcesCountRef.current += 1
    if (focusSourcesCountRef.current > 1) {
      comboboxDiagnostic(
        'Combobox requires exactly one focus source (Input XOR Trigger). Detected multiple focus sources.'
      )
    }
    setFocusSource(type)
    return () => {
      focusSourcesRef.current.delete(type)
      focusSourcesCountRef.current -= 1
      const remaining = focusSourcesRef.current.values().next().value as
        | 'input'
        | 'trigger'
        | undefined
      setFocusSource(remaining ?? null)
    }
  }, [])

  const registerPopover = React.useCallback((id?: string) => {
    popoverCountRef.current += 1
    if (id) setPopoverId(id)
    if (popoverCountRef.current > 1) {
      comboboxDiagnostic('Combobox allows at most one Popover. Detected duplicate Popovers.')
    }
    return () => {
      popoverCountRef.current -= 1
    }
  }, [])

  React.useLayoutEffect(() => {
    if (focusSourcesCountRef.current === 0) {
      comboboxDiagnostic(
        'Combobox requires exactly one focus source (Input XOR Trigger). Detected 0 focus sources.'
      )
    }
  })

  const setActiveValue = React.useCallback(
    (val: string | null, source: 'keyboard' | 'pointer' | null = 'pointer') => {
      if (val === null) {
        activeSourceRef.current = null
        setActiveSourceState(null)
        setActiveValueState(null)
        return
      }
      // Leave-restore (#9 joint seam): a non-keyboard request for the
      // committed value while keyboard-active is ignored, so Listbox root
      // leave cannot clobber keyboard intent. Pointer to any other value
      // still overwrites (CB-NAV-05 hover half).
      if (
        source !== 'keyboard' &&
        activeSourceRef.current === 'keyboard' &&
        val === (value ?? null)
      ) {
        return
      }
      activeSourceRef.current = source
      setActiveSourceState(source)
      setActiveValueState(val)
    },
    [value]
  )

  const clearPointerActive = React.useCallback(() => {
    if (activeSourceRef.current !== 'pointer') return
    activeSourceRef.current = null
    setActiveSourceState(null)
    setActiveValueState(value ?? null)
  }, [value])

  // Fresh opens clear active and defer resolution: Overlay mounts
  // popover content (and option registrations) in a later commit, so the
  // collection reads empty here. The resolver below applies the valid
  // selection or pending first/last once options register.
  const prevOpenRef = React.useRef(false)
  const needsResolveRef = React.useRef(false)
  React.useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = isOpen
    if (isOpen && !wasOpen) {
      needsResolveRef.current = true
      activeSourceRef.current = null
      setActiveSourceState(null)
      setActiveValueState(null)
    } else if (isOpen) {
      // Value changed while open (CB-NAV-06): follow the selection.
      activeSourceRef.current = null
      setActiveSourceState(null)
      setActiveValueState(value ?? null)
    } else {
      needsResolveRef.current = false
      pendingDirectionRef.current = null
      activeSourceRef.current = null
      setActiveSourceState(null)
      setActiveValueState(null)
    }
  }, [isOpen, value, getOrderedOptions])

  React.useEffect(() => {
    if (!isOpen || !needsResolveRef.current) return
    const enabled = getOrderedOptions().filter(opt => !opt.disabled)
    // Wait for registrations; empty collections settle on null active.
    if (enabled.length === 0) return
    const committed = value ?? null
    let next: string | null = null
    if (committed != null && enabled.some(opt => opt.value === committed)) {
      next = committed
    } else if (pendingDirectionRef.current != null) {
      const at =
        pendingDirectionRef.current === 1 ? enabled[0] : enabled[enabled.length - 1]
      if (at) next = at.value
    }
    needsResolveRef.current = false
    pendingDirectionRef.current = null
    setActiveValueState(next)
  }, [isOpen, optionsVersion, value, getOrderedOptions])

  const effectiveActive = activeValue ?? (isOpen ? value : null)
  const activeOption = effectiveActive ? optionsMapRef.current.get(effectiveActive) : null
  const activeOptionId =
    activeOption && activeOption.node && activeOption.node.isConnected
      ? activeOption.id
      : null

  const notifyInput = onInputValueChange ?? onInputChange

  // Last requested open state. Collapses duplicate requests inside one
  // gesture — Overlay's deferred click-dismiss after a blur-dismiss, Tab
  // commit followed by blur, CB-OPEN-03 open spam while the parent stays
  // closed — and re-arms on every settled render so programmatic prop
  // changes stay callback-free (CB-OPEN-06) yet actionable afterwards.
  const lastOpenRequestRef = React.useRef<boolean>(isOpen)
  React.useEffect(() => {
    lastOpenRequestRef.current = isOpen
  })

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen === lastOpenRequestRef.current) return
      lastOpenRequestRef.current = nextOpen
      if (nextOpen && !isOpen) onOpen?.()
      if (!isControlledOpen) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
      if (!nextOpen && isOpen) onDismiss?.()
    },
    [isControlledOpen, isOpen, onOpen, onOpenChange, onDismiss]
  )

  const requestArrowOpen = React.useCallback(
    (direction: 1 | -1) => {
      pendingDirectionRef.current = direction
      setIsOpen(true)
    },
    [setIsOpen]
  )

  const handleInputChange = React.useCallback(
    (nextInput: string) => {
      if (!isControlledInput) setInternalInput(nextInput)
      notifyInput?.(nextInput)
      const enabled = getOrderedOptions().filter(opt => !opt.disabled)
      // Typing is fresh keyboard intent, so the first match is Tab-eligible.
      if (enabled.length > 0) {
        const first = enabled[0]
        if (first) setActiveValue(first.value, 'keyboard')
      }
    },
    [isControlledInput, notifyInput, getOrderedOptions, setActiveValue]
  )

  const revertToCommittedText = React.useCallback(() => {
    // #13: select-only has no text authority — revert is a no-op there.
    if (selectOnly) return
    const committedLabel =
      value != null ? (optionsMapRef.current.get(value)?.textValue ?? String(value)) : ''
    if (inputValue !== committedLabel) {
      handleInputChange(committedLabel)
    }
  }, [selectOnly, value, inputValue, handleInputChange])

  const handleSelect = React.useCallback(
    (nextVal: string | null) => {
      if (!isControlledValue) setInternalValue(nextVal)
      onChange?.(nextVal)
      if (nextVal !== null && !isControlledInput && !selectOnly) {
        const selectedOpt = optionsMapRef.current.get(nextVal)
        const labelText = selectedOpt?.textValue ?? nextVal
        handleInputChange(labelText)
      }
      setIsOpen(false)
    },
    [isControlledValue, isControlledInput, selectOnly, onChange, handleInputChange, setIsOpen]
  )

  // Outside press (#3): Overlay dismisses non-inert layers synchronously
  // on pointerdown — before blur — so the revert must run in the same
  // phase. This granular hook fires first inside requestOutside, reusing
  // Overlay's own inside/outside accounting (no duplicate geometry).
  const handleOutsidePress = React.useCallback(() => {
    if (!closeOnBlur) return
    revertToCommittedText()
  }, [closeOnBlur, revertToCommittedText])

  const handleSourceBlur = React.useCallback(
    (relatedTarget: EventTarget | null) => {
      if (!closeOnBlur) return
      if (
        relatedTarget instanceof HTMLElement &&
        (sourceRef.current?.contains(relatedTarget) ||
          (typeof document !== 'undefined' &&
            document.getElementById(popoverId)?.contains(relatedTarget)))
      ) {
        return
      }
      // Focus left the combobox while open: editable restores committed
      // text, both shapes clear active, and close is requested unless
      // already requested. Covers keyboard and programmatic focus exits;
      // pointer exits revert earlier in handleOutsidePress (while the
      // registry is still mounted) so order stays revert-before-dismiss.
      // Blur after unmount must NOT revert: the registry is empty and the
      // raw-value fallback would fabricate a phantom text request.
      if (isOpen) {
        revertToCommittedText()
        activeSourceRef.current = null
        setActiveSourceState(null)
        setActiveValueState(null)
      }
      setIsOpen(false)
    },
    [closeOnBlur, isOpen, popoverId, revertToCommittedText, setIsOpen]
  )

  const contextValue = React.useMemo<ComboboxContextValue>(
    () => ({
      value,
      inputValue,
      isOpen,
      disabled,
      selectOnly,
      closeOnBlur,
      setIsOpen,
      requestArrowOpen,
      handleSelect,
      handleInputChange,
      handleSourceBlur,
      sourceRef,
      activeValue,
      activeSource,
      setActiveValue,
      clearPointerActive,
      activeOptionId,
      registerOption,
      getOrderedOptions,
      popoverId,
      registerFocusSource,
      registerPopover,
      revertToCommittedText,
    }),
    [
      value,
      inputValue,
      isOpen,
      disabled,
      selectOnly,
      closeOnBlur,
      setIsOpen,
      requestArrowOpen,
      handleSelect,
      handleInputChange,
      handleSourceBlur,
      activeValue,
      activeSource,
      setActiveValue,
      clearPointerActive,
      activeOptionId,
      registerOption,
      getOrderedOptions,
      popoverId,
      registerFocusSource,
      registerPopover,
      revertToCommittedText,
    ]
  )

  return (
    <ComboboxContext.Provider value={contextValue}>
      <Overlay
        open={isOpen}
        onOutsidePress={handleOutsidePress}
        onDismiss={() => setIsOpen(false)}
        isolation={false}
        closeOnScroll
        anchor={sourceRef}
      >
        {children}
      </Overlay>
    </ComboboxContext.Provider>
  )
}

Combobox.Input = ComboboxInput
Combobox.Trigger = ComboboxTrigger
Combobox.Popover = ComboboxPopover
Combobox.Option = ComboboxOption
Combobox.Section = ListboxSection
Combobox.Empty = ListboxEmpty

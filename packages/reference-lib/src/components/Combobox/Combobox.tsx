import * as React from 'react'
import { Input, Button, type PrimitiveProps } from '@reference-ui/react'
import { Overlay, useOverlay, type OverlayContentProps } from '../Overlay'
import {
  Listbox,
  ListboxOption,
  ListboxSection,
  ListboxEmpty,
  type ListboxOptionProps,
  type VirtualFocusItem,
} from '../Listbox'
import { Tree, TreeItem } from '../Tree'
import {
  ComboboxContext,
  shadowContainerForSource,
  type ComboboxActiveSource,
  type ComboboxAutocomplete,
  type ComboboxContextValue,
  type ComboboxGridAdapter,
  type ComboboxOptionEntry,
  type ComboboxVirtualEntry,
  type VirtualFocusNavigationKey,
  type VirtualFocusNavigationRequest,
} from './combobox-context'
import { TypeaheadModel, shouldIgnoreTypeaheadKey } from '../RovingFocus/typeahead'
import {
  scanAuthoredCollections,
  scanHasPopoverContent,
  type AuthoredCollectionRefs,
} from './authored'
import { completesInline, completionForPrefix } from './autocomplete'
import {
  currentVirtualIndex,
  directionForElement,
  findDuplicateValue,
  findVirtualMatch,
  validateVirtualMount,
  validateVirtualTarget,
} from './virtual-focus'

export type {
  ComboboxAutocomplete,
  ComboboxGridAdapter,
  VirtualFocusItem,
  VirtualFocusNavigationKey,
  VirtualFocusNavigationRequest,
}

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

/** Authored-adapter shape check (#5): role/items/getNextIndex/scrollToIndex. */
function isGridAdapter(value: unknown): value is ComboboxGridAdapter {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    candidate.role === 'grid' &&
    Array.isArray(candidate.items) &&
    typeof candidate.getNextIndex === 'function' &&
    typeof candidate.scrollToIndex === 'function'
  )
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
   * Custom-value policy (#2, W-24, Ark-exact name, default `false`).
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
  // Composition display state (#1): the completion must clear while the
  // IME owns the text. State (not just the ref) so the display value
  // below recomputes through React on every major — no imperative write
  // for a version-specific tracker to restore.
  const [isComposing, setIsComposing] = React.useState(false)
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

  // #1: inline completion for autocomplete="inline"/"both". The DISPLAY
  // value (not the controlled text) carries the active label: React itself
  // sets the DOM from the prop, so no imperative write exists for a
  // version-specific controlled-input tracker to restore (17 parity).
  // Preview navigation never emits text callbacks (CB-MODE-07) —
  // prop-driven value sets dispatch no change events.
  const completed =
    context != null &&
    completesInline(context.autocomplete) &&
    context.isOpen &&
    !isComposing
      ? completionForPrefix(context.inputValue, context.activeOptionText)
      : null
  const displayValue = completed ?? inputValue

  // Suffix selection for fresh completions: the effect applies when the
  // (completion, prefix) pair changes and leaves the caret alone
  // otherwise, so the user's own caret moves survive re-renders. One
  // exception: React 17/18 rewrites the value prop on unrelated commits,
  // collapsing the caret to the end — a collapsed-at-end caret with an
  // unchanged pair is re-selected (a user's Left/Home/click lands
  // elsewhere and is preserved).
  const prevCompletionRef = React.useRef<{ completed: string; prefix: string } | null>(null)
  React.useLayoutEffect(() => {
    const node = inputRef.current
    const prev = prevCompletionRef.current
    if (completed == null || !node || !context) {
      prevCompletionRef.current = null
      return
    }
    const prefix = context.inputValue
    if (prev && prev.completed === completed && prev.prefix === prefix) {
      if (
        node.selectionStart === completed.length &&
        node.selectionEnd === completed.length
      ) {
        node.setSelectionRange(prefix.length, completed.length)
      }
      return
    }
    prevCompletionRef.current = { completed, prefix }
    node.setSelectionRange(prefix.length, completed.length)
  })

  if (!context || !setIsOpen || !handleInputChange) return null

  const isDisabled = disabled || disabledProp
  const isReadOnly = Boolean(readOnly)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    if (!e.defaultPrevented && !isDisabled && !isReadOnly) {
      handleInputChange(e.target.value)
      // #10: an edit requests open only when popover collection content
      // exists (CB-OPEN-03). The text request above always fires.
      if (!isOpen && context.hasPopoverContent) setIsOpen(true)
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
    // #1: composition owns the text — the display state clears any inline
    // completion through React so the IME never composes over a selected
    // suffix (CB-EDIT-05).
    isComposingRef.current = true
    setIsComposing(true)
  }

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    onCompositionEnd?.(e)
    isComposingRef.current = false
    setIsComposing(false)
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
      } else if (context.virtualAdapter) {
        context.navigateVirtual('ArrowDown')
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
      } else if (context.virtualAdapter) {
        context.navigateVirtual('ArrowUp')
      } else {
        stepActiveValue({
          enabled,
          current: context.activeValue,
          direction: -1,
          setActive: context.setActiveValue,
        })
      }
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      // Virtual grids only (#5): single-line inputs have no native page
      // scroll, so the adapter owns these keys. Non-virtual inputs leave
      // them native (LB-KEY-06 parity); Left/Right/Home/End stay native
      // even for grids (CB-EDIT-03) — 2D horizontal nav is the Trigger's.
      if (isOpen && context.virtualAdapter) {
        e.preventDefault()
        context.navigateVirtual(e.key)
      }
    } else if (e.key === 'Enter') {
      // Open Enter always resolves the session, so the key is always
      // handled while open (RAC "prevent default on Enter if isOpen",
      // CB-COMMIT-08): active commits, else custom commits when allowed
      // (CB-CUSTOM-01) or the committed text is restored (CB-COMMIT-02).
      // Closed Enter stays native (form submit). Zag's custom branch
      // skips prevention only because Zag tolerates rather than commits
      // custom text there — ours commits, so the form must not also fire.
      if (!isOpen) {
        // Native: fall through with no preventDefault.
      } else if (mountedActiveValue != null) {
        e.preventDefault()
        context.handleSelect(mountedActiveValue)
      } else {
        e.preventDefault()
        context.resolveUnmatchedText()
        context.setActiveValue(null)
        setIsOpen(false)
      }
    } else if (e.key === 'Tab') {
      // Native traversal is never prevented. With no keyboard-eligible
      // active option the session resolves (custom commit when allowed,
      // else revert) and closes instead of committing an option
      // (CB-COMMIT-05); closed popups leave Tab entirely native (CB-COMMIT-09).
      if (isOpen) {
        if (keyboardActiveValue != null) {
          context.handleSelect(keyboardActiveValue)
        } else {
          context.resolveUnmatchedText()
          context.setActiveValue(null)
          setIsOpen(false)
        }
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        // #7: granular hook runs first with the real native event
        // (Overlay #3 vocabulary); preventDefault stops revert,
        // callbacks, and dismissal (CB-REVERT-02). The native flag is
        // read live — the synthetic wrapper may have copied it early.
        // Our own preventDefault then shields the Overlay layer, so the
        // path below stays the single dismissal sequence (CB-CLOSE-03).
        context.onEscape?.(e.nativeEvent)
        if (e.nativeEvent.defaultPrevented) return
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
      aria-autocomplete={context.autocomplete}
      aria-haspopup={context.popupRole}
      aria-controls={popoverId}
      aria-activedescendant={isOpen ? (context.activeOptionId ?? undefined) : undefined}
      disabled={isDisabled}
      readOnly={readOnly}
      value={displayValue}
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
      } else if (context.virtualAdapter) {
        context.navigateVirtual('ArrowDown')
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
      } else if (context.virtualAdapter) {
        context.navigateVirtual('ArrowUp')
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

    // #5: grid horizontal/page keys exist only for select-only Triggers
    // (editable inputs keep them native per CB-EDIT-03) and only with an
    // adapter; otherwise ignored as before.
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown'
    ) {
      if (context.isOpen && context.virtualAdapter) {
        e.preventDefault()
        context.navigateVirtual(e.key)
      }
      return
    }

    // #13: select-only mirror — Escape/Tab close with a value commit or
    // no-commit, native focus, cleared active ID, and zero text callbacks.
    if (e.key === 'Escape') {
      if (context.isOpen) {
        // #7: granular hook first (Overlay #3 vocabulary); preventDefault
        // stops the clear and the dismissal (CB-REVERT-02).
        context.onEscape?.(e.nativeEvent)
        if (e.nativeEvent.defaultPrevented) return
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
      if (context.isOpen) {
        if (context.virtualAdapter) context.navigateVirtual('Home')
        else activateFirstLast('first')
      }
      return
    }

    if (e.key === 'End') {
      if (context.isOpen) {
        if (context.virtualAdapter) context.navigateVirtual('End')
        else activateFirstLast('last')
      }
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
      // #5: with an adapter the buffer searches logical items (mounted
      // or not) and scrolls unmounted matches into the DOM.
      const adapter = context.virtualAdapter
      if (adapter) {
        const match = model.handleKey(
          e.key,
          context.activeValue,
          adapter.items.map(item => ({ id: item.value, text: item.textValue || item.value }))
        )
        if (match != null && match !== context.activeValue) {
          const index = adapter.items.findIndex(item => item.value === match)
          if (index !== -1) context.requestVirtualIndex(index)
        }
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
      aria-haspopup={context.popupRole}
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

export type ComboboxPopoverProps = OverlayContentProps & {
  /**
   * Custom grid adapter (#5). Metadata-only at this layer: the root
   * reads it from authored children (see `authored.ts`), validates
   * single-authority, and drives navigation/mount timing. Never reaches
   * the DOM.
   */
  virtualFocus?: ComboboxGridAdapter
}

export function ComboboxPopover({
  children,
  style,
  id: idProp,
  onMouseLeave,
  onPointerLeave,
  onMouseDown,
  virtualFocus: _virtualFocus,
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

  // #5 (CB-DOM-04): role="grid" comes only from an effective adapter
  // (conflicts resolve to null, so presentation survives ADAPTER-08).
  // Nested Listbox/Tree supply their own roles; nothing is invented.
  const popoverRole = context?.virtualAdapter ? 'grid' : 'presentation'

  return (
    <Overlay.Content
      data-reference-combobox-popover=""
      role={popoverRole}
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

export type ComboboxVirtualItemProps = {
  /** Logical index into the authored `virtualFocus` adapter items. */
  index: number
  /** Exactly one native child; behavior slots onto it with no wrapper. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Transparent grid cell (#5, CB-ADAPTER-04/05/06). Slots the logical
 * item's stable value-derived ID, disabled/selected/active state, ref,
 * and events onto exactly one native child. Consumer child handlers run
 * before Combobox defaults; `preventDefault()` cancels preview and
 * commit independently. Invalid shapes (no adapter, bad index,
 * zero/multiple/fragment/non-ref-capable child) diagnose in dev and
 * render unwired — they can never become active or commit.
 */
export const ComboboxVirtualItem = React.forwardRef<HTMLElement, ComboboxVirtualItemProps>(
  function ComboboxVirtualItem(
    { index, children, className, style }: ComboboxVirtualItemProps,
    userRef
  ) {
    const context = React.useContext(ComboboxContext)
    const nodeRef = React.useRef<HTMLElement | null>(null)

    const adapter = context?.virtualAdapter ?? null
    const item = adapter && Number.isInteger(index) ? adapter.items[index] : undefined
    const value = item?.value ?? null
    const id =
      value != null && context ? `${context.popoverId}-virt-${value.replace(/[^a-zA-Z0-9_-]/g, '')}` : null
    const disabled = item?.disabled ?? false

    const childCount = React.Children.count(children)
    const child =
      childCount === 1 && React.isValidElement(children) ? children : null
    const childType = (child?.type ?? null) as React.ElementType | null
    const isInvalidShape =
      adapter == null ||
      item == null ||
      child == null ||
      childType === React.Fragment

    if (isInvalidShape) {
      if (adapter == null) {
        comboboxDiagnostic(
          `Combobox.VirtualItem index ${index} requires an effective Popover virtualFocus adapter (none authored, or the authored one is conflicted/invalid). Rendered unwired; it cannot become active.`
        )
      } else if (item == null) {
        comboboxDiagnostic(
          `Combobox.VirtualItem index ${index} is out of range (0..${adapter.items.length - 1}). Rendered unwired; it cannot become active.`
        )
      } else {
        comboboxDiagnostic(
          'Combobox.VirtualItem requires exactly one native child element (no fragment, no zero/multiple children). Rendered unwired; it cannot become active.'
        )
      }
    }

    const childProps = (child?.props ?? {}) as Record<string, unknown>
    const childRef = (child as { ref?: React.Ref<HTMLElement> } | null)?.ref

    // Stable identity: a fresh callback each render would detach and
    // re-attach the child ref every commit, looping when the consumer
    // ref callback sets state. Above the early return (hook order).
    const composedRef = React.useCallback(
      (node: HTMLElement | null) => {
        nodeRef.current = node
        if (typeof childRef === 'function') {
          childRef(node)
        } else if (childRef && typeof childRef === 'object') {
          ;(childRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
        if (typeof userRef === 'function') {
          userRef(node)
        } else if (userRef && typeof userRef === 'object') {
          ;(userRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
      },
      [childRef, userRef]
    )

    const registerVirtualItem = context?.registerVirtualItem
    React.useLayoutEffect(() => {
      if (isInvalidShape || !registerVirtualItem || value == null || id == null) return
      const node = nodeRef.current
      if (node == null) {
        comboboxDiagnostic(
          `Combobox.VirtualItem index ${index} child is not ref-capable (no host node resolved). It cannot become active.`
        )
        return
      }
      return registerVirtualItem({ index, value, id, node, disabled })
    }, [isInvalidShape, registerVirtualItem, value, id, index, disabled])

    if (!context || isInvalidShape || child == null || id == null || value == null) {
      return <>{children}</>
    }

    const isActive = context.activeValue === value && context.activeOptionId === id
    const isSelected = context.value === value

    const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
      ;(childProps.onPointerMove as ((e: React.PointerEvent<HTMLElement>) => void) | undefined)?.(e)
      if (e.defaultPrevented || e.pointerType === 'touch' || disabled) return
      context.previewVirtualItem(index)
    }
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      ;(childProps.onClick as ((e: React.MouseEvent<HTMLElement>) => void) | undefined)?.(e)
      if (e.defaultPrevented || disabled) return
      context.commitVirtualItem(index)
    }

    const childClassName = childProps.className as string | undefined
    const childStyle = childProps.style as React.CSSProperties | undefined

    return React.cloneElement(child, {
      id,
      ref: composedRef,
      onPointerMove: handlePointerMove,
      onClick: handleClick,
      'aria-disabled': disabled || undefined,
      'data-disabled': disabled ? '' : undefined,
      'aria-selected': isSelected || undefined,
      'data-selected': isSelected ? '' : undefined,
      'data-active': isActive ? '' : undefined,
      className: [childClassName, className].filter(Boolean).join(' ') || undefined,
      style: { ...childStyle, ...style },
    } as Record<string, unknown>)
  }
)

export function Combobox({
  children,
  value,
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
  autocomplete = 'list',
  allowCustomValue = false,
  onEscape,
}: ComboboxProps) {
  // Controlled-only: value + onChange are required; there is no uncontrolled branch.
  if (globalProcess?.env?.NODE_ENV !== 'production') {
    if (value === undefined) {
      const err =
        '[reference-ui] Combobox: Missing required "value" prop. Combobox is controlled-only: pass value + onChange.'
      console.error(err)
      throw new Error(err)
    }
    if (onChange === undefined) {
      const err =
        '[reference-ui] Combobox: Missing required "onChange" prop. Combobox is controlled-only: pass value + onChange.'
      console.error(err)
      throw new Error(err)
    }
  }

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
  // Typing while the mounted registry is empty (closed popover, or zero
  // options) pends the typing rule: the resolver activates the first
  // enabled match once options mount, so fast closed typing is not a
  // commit-timing race (CB-MODE-03/04 determinism). Grids resolve live
  // (logical items need no mount) and never need this flag.
  const pendingTypingRef = React.useRef(false)
  const optionsMapRef = React.useRef<Map<string, ComboboxOptionEntry>>(new Map())
  // Label cache (#1 composition): revert restores the committed label
  // even after filtering unmounts the option. Entries survive unmount
  // (overwrite on re-register); values never mounted still fall back
  // to the raw value (CB-COMMIT-05).
  const labelCacheRef = React.useRef<Map<string, string>>(new Map())
  // Registration mutates the map (no render on its own), so each
  // register/unregister also bumps a version to recompute the mounted-only
  // active ID. The bump carries no data — the map is still the source.
  const [optionsVersion, setOptionsVersion] = React.useState(0)

  const registerOption = React.useCallback((entry: ComboboxOptionEntry) => {
    optionsMapRef.current.set(entry.value, entry)
    if (entry.textValue) labelCacheRef.current.set(entry.value, entry.textValue)
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

  // Authored-children inspection (#10 content gate + #5 adapter /
  // ADAPTER-02/03/08 diagnostics). Closed popovers unmount, so the gate
  // reads authored children + collection metadata, never the live DOM
  // (Overlay #4 non-goal). Render-time: children updates rescan.
  const authoredScan = React.useMemo(
    () =>
      scanAuthoredCollections(
        children,
        {
          Popover: ComboboxPopover,
          ComboboxOption,
          ListboxOption,
          VirtualItem: ComboboxVirtualItem,
          Listbox,
          Tree,
          TreeItem,
          Empty: ListboxEmpty,
        },
        onChange != null
      ),
    [children, onChange]
  )
  const hasPopoverContent = scanHasPopoverContent(authoredScan)

  const authoredAdapter: ComboboxGridAdapter | null = isGridAdapter(
    authoredScan.virtualFocusAdapter
  )
    ? (authoredScan.virtualFocusAdapter as ComboboxGridAdapter)
    : null
  if (authoredScan.virtualFocusAdapter != null && authoredAdapter == null) {
    comboboxDiagnostic(
      'Combobox.Popover virtualFocus must be a grid adapter (role "grid" with items, getNextIndex, scrollToIndex). The value is ignored.'
    )
  }
  const duplicateValue = authoredAdapter
    ? findDuplicateValue(authoredAdapter.items)
    : null
  if (duplicateValue != null) {
    comboboxDiagnostic(
      `Combobox virtualFocus items must have unique values. Duplicate: "${duplicateValue}". The adapter is ignored until values are unique.`
    )
  }

  // Single-authority resolution (#5, CB-ADAPTER-08): authored
  // virtualFocus plus a nested collection, or two built-in collections,
  // diagnose and leave every collection path inert until exactly one
  // authority remains. Render order never chooses.
  const authoredKinds = authoredScan.collectionKinds
  const collectionConflict =
    (authoredAdapter != null && authoredKinds.length > 0) || authoredKinds.length > 1
  if (collectionConflict) {
    const authorities =
      authoredAdapter != null
        ? ['virtualFocus', ...authoredKinds]
        : authoredKinds
    comboboxDiagnostic(
      `Combobox.Popover must resolve exactly one collection authority; found ${authorities.join(' + ')}. Neither drives navigation, active state, scroll, or commit until exactly one remains.`
    )
  }
  if (authoredScan.nestedOnChangeKind != null) {
    comboboxDiagnostic(
      `Combobox owns commit authority: a nested ${authoredScan.nestedOnChangeKind} must not carry its own onChange. Remove it; root onChange is the sole commit callback.`
    )
  }
  if (authoredScan.multipleListbox) {
    comboboxDiagnostic(
      'Combobox commit contract is scalar: a nested multiple-selection Listbox is incompatible. Use single selection (chips are a Field composition).'
    )
  }

  const virtualAdapter =
    collectionConflict || duplicateValue != null ? null : authoredAdapter
  // Live adapter for registration-time callbacks (ref: mounts must not
  // re-subscribe when the adapter object identity changes).
  const adapterRef = React.useRef(virtualAdapter)
  adapterRef.current = virtualAdapter
  const virtualMapRef = React.useRef(new Map<number, ComboboxVirtualEntry>())
  // Requested-but-unmounted logical target (#5 mount timing). Identity
  // is index + value so stale mounts after metadata replacement can
  // never publish (CB-ADAPTER-07).
  const pendingVirtualRef = React.useRef<{ index: number; value: string } | null>(null)
  const [pendingVirtualIndex, setPendingVirtualIndex] = React.useState<number | null>(null)
  // Metadata replacement/reorder cancels stale mount requests; identity
  // follows the items array so inline adapter wrappers stay harmless.
  const adapterItems = virtualAdapter?.items
  React.useEffect(() => {
    pendingVirtualRef.current = null
    setPendingVirtualIndex(null)
  }, [adapterItems])

  const popupRole: 'listbox' | 'tree' | 'grid' = virtualAdapter
    ? 'grid'
    : authoredKinds.length === 1 && authoredKinds[0] === 'tree'
      ? 'tree'
      : 'listbox'

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
      // Two-authority conflict (#5, CB-ADAPTER-08): active sets are
      // inert (clearing still works) until exactly one authority
      // remains. Covers Listbox hover/focus call sites too.
      if (collectionConflict && val !== null) return
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
    [value, collectionConflict]
  )

  const clearPointerActive = React.useCallback(() => {
    if (activeSourceRef.current !== 'pointer') return
    activeSourceRef.current = null
    setActiveSourceState(null)
    setActiveValueState(value ?? null)
  }, [value])

  // Logical-target activation (#5): validates the index, activates
  // mounted targets with keyboard source, and pends + `scrollToIndex`
  // for unmounted ones. Active value tracks the logical target either
  // way; the ID publishes only after mount (optionsMap lookup). No-op
  // without an adapter (absent, malformed, duplicate, or conflicted).
  const requestVirtualIndex = React.useCallback(
    (index: number) => {
      const adapter = adapterRef.current
      if (!adapter) return
      if (validateVirtualTarget(adapter.items, index) !== 'ok') {
        comboboxDiagnostic(
          `Combobox grid target index ${index} is out of range or disabled. Ignored; it cannot become active.`
        )
        return
      }
      const target = adapter.items[index]
      if (!target) return
      const mounted = virtualMapRef.current.get(index)
      if (
        mounted &&
        mounted.node &&
        mounted.node.isConnected &&
        mounted.value === target.value
      ) {
        pendingVirtualRef.current = null
        setPendingVirtualIndex(null)
        setActiveValue(target.value, 'keyboard')
        mounted.node.scrollIntoView({ block: 'nearest' })
        return
      }
      const pending = pendingVirtualRef.current
      if (pending && pending.index === index && pending.value === target.value) return
      pendingVirtualRef.current = { index, value: target.value }
      setPendingVirtualIndex(index)
      setActiveValue(target.value, 'keyboard')
      adapter.scrollToIndex(index)
    },
    [setActiveValue]
  )

  // Key navigation through the grid adapter (#5). Null (no move) is
  // valid; invalid `getNextIndex` results diagnose via requestVirtualIndex.
  const navigateVirtual = React.useCallback(
    (key: VirtualFocusNavigationKey) => {
      const adapter = adapterRef.current
      if (!adapter) return
      const next = adapter.getNextIndex({
        key,
        currentIndex: currentVirtualIndex(adapter.items, activeValue),
        direction: directionForElement(sourceRef.current),
      })
      if (next == null) return
      requestVirtualIndex(next)
    },
    [activeValue, requestVirtualIndex]
  )

  // Prefix search over logical adapter items (#5, CB-ADAPTER-07).
  const searchVirtual = React.useCallback(
    (text: string) => {
      const adapter = adapterRef.current
      if (!adapter) return
      const match = findVirtualMatch(adapter.items, text)
      if (match == null) {
        setActiveValue(null)
      } else {
        requestVirtualIndex(match)
      }
    },
    [requestVirtualIndex, setActiveValue]
  )

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
      pendingTypingRef.current = false
      pendingVirtualRef.current = null
      setPendingVirtualIndex(null)
      activeSourceRef.current = null
      setActiveSourceState(null)
      setActiveValueState(null)
    }
  }, [isOpen, value, getOrderedOptions])

  React.useEffect(() => {
    if (!isOpen) return
    if (!needsResolveRef.current && !pendingTypingRef.current) return
    // Conflicted collections stay unresolved (CB-ADAPTER-08); the flag
    // is a dep so single-authority recovery rerenders resolve.
    if (collectionConflict) return
    // Grid open (#5): resolve over logical items — selection wins,
    // else first/last enabled by opening direction. Unmounted targets
    // pend + scroll; no mount wait needed.
    const adapter = adapterRef.current
    if (adapter) {
      const items = adapter.items
      const committed = value ?? null
      let target: number | null = null
      if (committed != null) {
        const selected = items.findIndex(item => item.value === committed && !item.disabled)
        if (selected !== -1) target = selected
      }
      if (target == null && pendingDirectionRef.current != null) {
        const order =
          pendingDirectionRef.current === 1
            ? items.map((item, at) => ({ item, at }))
            : items.map((item, at) => ({ item, at })).reverse()
        target = order.find(entry => !entry.item.disabled)?.at ?? null
      }
      needsResolveRef.current = false
      pendingDirectionRef.current = null
      if (target != null) {
        pendingTypingRef.current = false
        requestVirtualIndex(target)
      } else if (pendingTypingRef.current) {
        // Deferred grid typing rule: re-apply the prefix search the
        // open effect wiped, against current metadata.
        pendingTypingRef.current = false
        searchVirtual(inputValue)
      } else setActiveValueState(null)
      return
    }
    const enabled = getOrderedOptions().filter(opt => !opt.disabled)
    // Wait for registrations; empty collections settle on null active.
    if (enabled.length === 0) return
    const committed = value ?? null
    let next: string | null = null
    let nextSource: ComboboxActiveSource = null
    if (committed != null && enabled.some(opt => opt.value === committed)) {
      next = committed
    } else if (pendingDirectionRef.current != null) {
      const at =
        pendingDirectionRef.current === 1 ? enabled[0] : enabled[enabled.length - 1]
      if (at) next = at.value
    } else if (pendingTypingRef.current) {
      // Deferred typing rule: first enabled match, Tab-eligible.
      const first = enabled[0]
      if (first) {
        next = first.value
        nextSource = 'keyboard'
      }
    }
    needsResolveRef.current = false
    pendingDirectionRef.current = null
    pendingTypingRef.current = false
    activeSourceRef.current = nextSource
    setActiveSourceState(nextSource)
    setActiveValueState(next)
  }, [isOpen, optionsVersion, value, inputValue, getOrderedOptions, collectionConflict, requestVirtualIndex, searchVirtual])

  const effectiveActive = activeValue ?? (isOpen ? value : null)
  const activeOption = effectiveActive ? optionsMapRef.current.get(effectiveActive) : null
  const activeOptionId =
    activeOption && activeOption.node && activeOption.node.isConnected
      ? activeOption.id
      : null
  const activeOptionText =
    activeOption && activeOption.node && activeOption.node.isConnected
      ? (activeOption.textValue ?? activeOption.value)
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
      // Grid typing (#5, CB-ADAPTER-07): prefix search over logical
      // items (mounted or not); unmounted matches pend + scroll.
      // Conflicted collections take no active state (CB-ADAPTER-08).
      if (collectionConflict) return
      if (adapterRef.current) {
        // Grids resolve live; only closed typing pends (a fresh open
        // wipes event-time state, and the resolver restores it). Typing
        // while open must not arm the flag, or a later mount would
        // clobber arrow navigation with a stale search.
        if (!isOpen) pendingTypingRef.current = true
        searchVirtual(nextInput)
        return
      }
      const enabled = getOrderedOptions().filter(opt => !opt.disabled)
      // Typing is fresh keyboard intent, so the first match is Tab-eligible.
      // Live resolution also satisfies a pending open (the resolver must
      // not run after us and wipe fresher intent back to null).
      if (enabled.length > 0) {
        needsResolveRef.current = false
        pendingTypingRef.current = false
        const first = enabled[0]
        if (first) setActiveValue(first.value, 'keyboard')
      } else {
        pendingTypingRef.current = true
      }
    },
    [isControlledInput, notifyInput, getOrderedOptions, setActiveValue, searchVirtual, collectionConflict, isOpen]
  )

  // Committed display label (#1 composition): the mounted option's
  // textValue, else the label cache (survives filtering unmounts), else
  // the raw value. Shared by revert and custom-value matching so the two
  // paths agree on what "already committed" means.
  const getCommittedLabel = React.useCallback((): string => {
    if (value == null) return ''
    return (
      optionsMapRef.current.get(value)?.textValue ??
      labelCacheRef.current.get(value) ??
      String(value)
    )
  }, [value])

  const revertToCommittedText = React.useCallback(() => {
    // #13: select-only has no text authority — revert is a no-op there.
    if (selectOnly) return
    const committedLabel = getCommittedLabel()
    if (inputValue !== committedLabel) {
      handleInputChange(committedLabel)
    }
  }, [selectOnly, inputValue, handleInputChange, getCommittedLabel])

  // Unmatched-text session resolution (#2, W-24, CB-CUSTOM-01/02). With
  // `allowCustomValue`, exact input text commits as the value (empty maps
  // to `null`, never normalized); otherwise the committed text is
  // restored. Silent when the text already matches the committed value
  // (Zag `isCustomValue`: inputValue !== valueAsString). No text
  // callback on the custom path — the input already shows the text.
  const resolveUnmatchedText = React.useCallback(() => {
    // #13: select-only has no text authority.
    if (selectOnly) return
    if (!allowCustomValue) {
      revertToCommittedText()
      return
    }
    // Two-authority conflict (#5, CB-ADAPTER-08): commits stay inert.
    if (collectionConflict) return
    if (inputValue === getCommittedLabel()) return
    // B-36: re-committing the identical value is silent — dismiss still runs.
    const nextVal = inputValue === '' ? null : inputValue
    if (nextVal !== value) {
      onChange(nextVal)
    }
  }, [
    selectOnly,
    allowCustomValue,
    collectionConflict,
    inputValue,
    getCommittedLabel,
    value,
    onChange,
    revertToCommittedText,
  ])

  const handleSelect = React.useCallback(
    (nextVal: string | null) => {
      // Two-authority conflict (#5, CB-ADAPTER-08): no adapter
      // receives a commit until exactly one authority remains.
      if (collectionConflict) return
      // B-36: re-committing the identical value is silent (Listbox single
      // LB-SINGLE-05 parity) — text sync and dismiss still run.
      if (nextVal !== value) {
        onChange(nextVal)
      }
      if (nextVal !== null && !isControlledInput && !selectOnly) {
        const selectedOpt = optionsMapRef.current.get(nextVal)
        const labelText = selectedOpt?.textValue ?? nextVal
        handleInputChange(labelText)
      }
      setIsOpen(false)
    },
    [isControlledInput, selectOnly, value, onChange, handleInputChange, setIsOpen, collectionConflict]
  )

  // Outside press (#3): Overlay dismisses non-inert layers synchronously
  // on pointerdown — before blur — so the revert must run in the same
  // phase. This granular hook fires first inside requestOutside, reusing
  // Overlay's own inside/outside accounting (no duplicate geometry).
  const handleOutsidePress = React.useCallback(() => {
    if (!closeOnBlur) return
    resolveUnmatchedText()
  }, [closeOnBlur, resolveUnmatchedText])

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
      // Focus left the combobox while open: editable resolves unmatched
      // text (custom commit when allowed, else committed-text restore),
      // both shapes clear active, and close is requested unless already
      // requested. Covers keyboard and programmatic focus exits, inside
      // dialogs or out (CB-CLOSE-02 branch, B-22); pointer exits resolve
      // earlier in handleOutsidePress (while the registry is still
      // mounted) so order stays resolve-before-dismiss. Blur after
      // unmount must NOT resolve: the registry is empty and the raw-value
      // fallback would fabricate a phantom text request.
      if (isOpen) {
        resolveUnmatchedText()
        activeSourceRef.current = null
        setActiveSourceState(null)
        setActiveValueState(null)
      }
      setIsOpen(false)
    },
    [closeOnBlur, isOpen, popoverId, resolveUnmatchedText, setIsOpen]
  )

  // VirtualItem mount registration (#5): validates range + value
  // identity against current metadata (stale mounts from replaced
  // adapters are ignored, CB-ADAPTER-07), rejects duplicate mounted
  // indices (CB-ADAPTER-05), mirrors into the mounted registry so the
  // active ID, commit labels, and revert labels resolve, and clears a
  // matching pending request (CB-ADAPTER-01 mount timing).
  const registerVirtualItem = React.useCallback(
    (entry: ComboboxVirtualEntry) => {
      const adapter = adapterRef.current
      const expected = adapter?.items[entry.index]
      if (
        !adapter ||
        !validateVirtualMount(adapter.items, entry.index) ||
        expected?.value !== entry.value
      ) {
        comboboxDiagnostic(
          `Combobox.VirtualItem index ${entry.index} does not match current adapter metadata (stale mount or out of range). Ignored; it cannot become active.`
        )
        return () => {}
      }
      // A live entry already present means two cells mounted the same
      // index: unmount cleanup always removes first, so remounts and
      // re-registrations never trip this.
      if (virtualMapRef.current.has(entry.index)) {
        comboboxDiagnostic(
          `Duplicate Combobox.VirtualItem mount at index ${entry.index}. Only one cell may mount per logical index.`
        )
        return () => {}
      }
      virtualMapRef.current.set(entry.index, entry)
      const labelText = expected.textValue || entry.value
      optionsMapRef.current.set(entry.value, {
        value: entry.value,
        id: entry.id,
        node: entry.node,
        disabled: entry.disabled,
        textValue: labelText,
        index: entry.index,
      })
      labelCacheRef.current.set(entry.value, labelText)
      setOptionsVersion(v => v + 1)
      const pending = pendingVirtualRef.current
      if (pending && pending.index === entry.index && pending.value === entry.value) {
        pendingVirtualRef.current = null
        setPendingVirtualIndex(null)
        setActiveValue(entry.value, 'keyboard')
      }
      return () => {
        virtualMapRef.current.delete(entry.index)
        const current = optionsMapRef.current.get(entry.value)
        if (current?.id === entry.id) optionsMapRef.current.delete(entry.value)
        setOptionsVersion(v => v + 1)
      }
    },
    [setActiveValue]
  )

  // Pointer preview on a mounted cell (#5, CB-ADAPTER-06 movement half).
  const previewVirtualItem = React.useCallback(
    (index: number) => {
      const adapter = adapterRef.current
      if (!adapter) return
      if (!validateVirtualMount(adapter.items, index)) {
        comboboxDiagnostic(
          `Combobox grid preview index ${index} is out of range. Ignored.`
        )
        return
      }
      const entry = virtualMapRef.current.get(index)
      if (!entry || !entry.node || !entry.node.isConnected || entry.disabled) return
      setActiveValue(entry.value, 'pointer')
    },
    [setActiveValue]
  )

  // Click/tap commit on a mounted cell (#5, CB-ADAPTER-06 commit half).
  const commitVirtualItem = React.useCallback(
    (index: number) => {
      const adapter = adapterRef.current
      if (!adapter) return
      const entry = virtualMapRef.current.get(index)
      if (!entry || !entry.node || !entry.node.isConnected || entry.disabled) return
      handleSelect(entry.value)
    },
    [handleSelect]
  )

  const contextValue = React.useMemo<ComboboxContextValue>(
    () => ({
      value,
      inputValue,
      isOpen,
      disabled,
      selectOnly,
      closeOnBlur,
      autocomplete,
      allowCustomValue,
      onEscape,
      hasPopoverContent,
      virtualAdapter,
      pendingVirtualIndex,
      navigateVirtual,
      searchVirtual,
      requestVirtualIndex,
      registerVirtualItem,
      previewVirtualItem,
      commitVirtualItem,
      popupRole,
      collectionConflict,
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
      activeOptionText,
      registerOption,
      getOrderedOptions,
      popoverId,
      registerFocusSource,
      registerPopover,
      revertToCommittedText,
      resolveUnmatchedText,
    }),
    [
      value,
      inputValue,
      isOpen,
      disabled,
      selectOnly,
      closeOnBlur,
      autocomplete,
      allowCustomValue,
      onEscape,
      hasPopoverContent,
      virtualAdapter,
      pendingVirtualIndex,
      navigateVirtual,
      searchVirtual,
      requestVirtualIndex,
      registerVirtualItem,
      previewVirtualItem,
      commitVirtualItem,
      popupRole,
      collectionConflict,
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
      activeOptionText,
      registerOption,
      getOrderedOptions,
      popoverId,
      registerFocusSource,
      registerPopover,
      revertToCommittedText,
      resolveUnmatchedText,
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
Combobox.VirtualItem = ComboboxVirtualItem
Combobox.Section = ListboxSection
Combobox.Empty = ListboxEmpty

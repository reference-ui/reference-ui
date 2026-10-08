import * as React from 'react'
import { Input, Div, type PrimitiveProps } from '@reference-ui/react'
import { Overlay } from '../Overlay'
import { Calendar, type ISODate, type DateRangeValue } from '../Calendar'
import { isValidISODate, type ISODate as CanonicalISODate, type ISOMonth } from '../Calendar/iso'
import { CalendarTodayIcon } from '@reference-ui/icons'
import { DateFieldSlotProvider, useSlotRegistration, useSlot } from './DateFieldSlots'
import {
  assertValidDateBounds,
  formatLocalDate,
  getSegmentAtCaret,
  isDateWithinConstraints,
  parseLocalDate,
  stepDateSegment,
} from './parse'

export type DateFieldRangeEndpoint = 'start' | 'end'
export type DateFieldRangeName = { start?: string; end?: string }

export type DateFieldRangeProps = Omit<
  PrimitiveProps<'div'>,
  'onChange' | 'value' | 'defaultValue'
> & {
  value: DateRangeValue | null
  onChange: (value: DateRangeValue | null) => void
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string | DateFieldRangeName
  form?: string
}

interface DateFieldRangeContextValue {
  rangeValue: DateRangeValue | null
  calendarValue: DateRangeValue | null
  locale: string
  min?: ISODate
  max?: ISODate
  isDateUnavailable?: (date: ISODate) => boolean
  isOpen: boolean
  canApply: boolean
  activeEndpoint: DateFieldRangeEndpoint
  disabled: boolean
  readOnly: boolean
  required: boolean
  pickerId: string
  paneMonth: ISOMonth | undefined
  setPaneMonth: (month: ISOMonth) => void
  endpointRefs: Record<DateFieldRangeEndpoint, React.RefObject<HTMLInputElement | null>>
  buffers: Record<DateFieldRangeEndpoint, string>
  isDirty: boolean
  failed: boolean
  constraintInvalid: Record<DateFieldRangeEndpoint, boolean>
  handleRangeSelect: (next: DateRangeValue) => void
  handleEndpointInput: (endpoint: DateFieldRangeEndpoint, e: React.ChangeEvent<HTMLInputElement>) => void
  handleEndpointKeyDown: (
    endpoint: DateFieldRangeEndpoint,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void
  handleEndpointBlur: (endpoint: DateFieldRangeEndpoint, e: React.FocusEvent<HTMLInputElement>) => void
  handleEndpointFocus: (endpoint: DateFieldRangeEndpoint) => void
  handleEndpointClick: (endpoint: DateFieldRangeEndpoint) => void
  handleCompositionStart: (endpoint: DateFieldRangeEndpoint) => void
  handleCompositionEnd: (endpoint: DateFieldRangeEndpoint) => void
  rootHandlers: {
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    onClick?: (e: React.MouseEvent<HTMLInputElement>) => void
  }
}

export const DateFieldRangeContext = React.createContext<DateFieldRangeContextValue | null>(null)

function mergeClassNames(...classes: Array<string | undefined | null | false>): string | undefined {
  const merged = classes.filter(Boolean).join(' ')
  return merged ? merged : undefined
}

function mergeStyles(
  ...styles: Array<React.CSSProperties | undefined>
): React.CSSProperties | undefined {
  const merged: React.CSSProperties = {}
  for (const s of styles) {
    if (s) Object.assign(merged, s)
  }
  return Object.keys(merged).length > 0 ? merged : undefined
}

export type DateFieldStartProps = PrimitiveProps<'input'>

export const DateFieldStart = React.forwardRef<HTMLInputElement, DateFieldStartProps>(
  function DateFieldStart(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'start',
      element: <input {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldStart.displayName = 'DateFieldStart'

export type DateFieldEndProps = PrimitiveProps<'input'>

export const DateFieldEnd = React.forwardRef<HTMLInputElement, DateFieldEndProps>(
  function DateFieldEnd(props, forwardedRef) {
    useSlotRegistration({
      slotId: 'end',
      element: <input {...(props as any)} />,
      meta: { ref: forwardedRef },
    })
    return null
  }
)
DateFieldEnd.displayName = 'DateFieldEnd'

function rangesEqual(a: DateRangeValue | null, b: DateRangeValue | null): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return a.start === b.start && (a.end ?? null) === (b.end ?? null)
}

function RangeEndpointInput({ endpoint }: { endpoint: DateFieldRangeEndpoint }) {
  const context = React.useContext(DateFieldRangeContext)
  const slot = useSlot(endpoint)
  if (!context) return null

  const {
    rangeValue,
    locale,
    isOpen,
    canApply: _canApply,
    activeEndpoint: _activeEndpoint,
    disabled,
    readOnly,
    required,
    pickerId,
    endpointRefs,
    buffers,
    isDirty,
    failed,
    constraintInvalid,
    handleEndpointInput,
    handleEndpointKeyDown,
    handleEndpointBlur,
    handleEndpointFocus,
    handleEndpointClick,
    handleCompositionStart,
    handleCompositionEnd,
    rootHandlers,
  } = context

  const pickerSlot = useSlot('picker')
  const isPickerPresent = Boolean(pickerSlot)
  void _canApply
  void _activeEndpoint

  const committedEndpoint = rangeValue?.[endpoint] ?? null
  const displayText = isDirty
    ? buffers[endpoint]
    : committedEndpoint != null && isValidISODate(committedEndpoint)
      ? formatLocalDate(committedEndpoint, locale)
      : (committedEndpoint ?? '')
  const isInvalid = failed || constraintInvalid[endpoint]
  const isEmpty = isDirty ? buffers[endpoint] === '' : committedEndpoint === null

  // Part-Resolution Law per endpoint: explicit Start/End props decorate,
  // managed state and accessibility always win, authored handlers run first.
  // (Root shorthands cannot address two inputs, so the root seeds only the
  // bezel — the law's root leg is vacuous for Range by design.)
  const explicitProps = (slot?.element.props as Record<string, any> | undefined) ?? {}
  const explicitRef = slot?.meta?.ref as React.Ref<HTMLInputElement> | undefined
  const ownRef = endpointRefs[endpoint]

  const composedRef = (node: HTMLInputElement | null) => {
    ownRef.current = node
    if (typeof explicitRef === 'function') {
      explicitRef(node)
    } else if (explicitRef && typeof explicitRef === 'object') {
      ;(explicitRef as React.RefObject<HTMLInputElement | null>).current = node
    }
  }

  const isDisabled = explicitProps.disabled ?? disabled
  const isReadOnly = explicitProps.readOnly ?? readOnly
  const isRequired = explicitProps.required ?? required
  const placeholder = explicitProps.placeholder
  const className = mergeClassNames(explicitProps.className)
  const style = mergeStyles(explicitProps.style)
  const inputId = explicitProps.id

  const onChangeComposed = (e: React.ChangeEvent<HTMLInputElement>) => {
    explicitProps.onChange?.(e)
    handleEndpointInput(endpoint, e)
  }
  const onKeyDownComposed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    explicitProps.onKeyDown?.(e)
    rootHandlers.onKeyDown?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleEndpointKeyDown(endpoint, e)
    }
  }
  const onBlurComposed = (e: React.FocusEvent<HTMLInputElement>) => {
    explicitProps.onBlur?.(e)
    rootHandlers.onBlur?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleEndpointBlur(endpoint, e)
    }
  }
  const onFocusComposed = (e: React.FocusEvent<HTMLInputElement>) => {
    explicitProps.onFocus?.(e)
    rootHandlers.onFocus?.(e)
    handleEndpointFocus(endpoint)
  }
  const onClickComposed = (e: React.MouseEvent<HTMLInputElement>) => {
    explicitProps.onClick?.(e)
    rootHandlers.onClick?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      handleEndpointClick(endpoint)
    }
  }
  const onCompositionStartComposed = (e: React.CompositionEvent<HTMLInputElement>) => {
    explicitProps.onCompositionStart?.(e)
    handleCompositionStart(endpoint)
  }
  const onCompositionEndComposed = (e: React.CompositionEvent<HTMLInputElement>) => {
    explicitProps.onCompositionEnd?.(e)
    handleCompositionEnd(endpoint)
  }

  const explicitAriaInvalid = explicitProps['aria-invalid']
  const ariaInvalid = isInvalid ? true : explicitAriaInvalid

  const {
    className: _xClassName,
    style: _xStyle,
    placeholder: _xPlaceholder,
    id: _xId,
    'aria-invalid': _xAriaInvalid,
    onInput: _xOnInput,
    onChange: _xOnChange,
    onKeyDown: _xOnKeyDown,
    onFocus: _xOnFocus,
    onBlur: _xOnBlur,
    onClick: _xOnClick,
    onCompositionStart: _xOnCompositionStart,
    onCompositionEnd: _xOnCompositionEnd,
    value: _xValue,
    defaultValue: _xDefaultValue,
    disabled: _xDisabled,
    readOnly: _xReadOnly,
    required: _xRequired,
    autoComplete: _xAutoComplete,
    autoCorrect: _xAutoCorrect,
    spellCheck: _xSpellCheck,
    inputMode: _xInputMode,
    role: _xRole,
    type: _xType,
    children: _xChildren,
    ...restExplicitProps
  } = explicitProps

  return (
    <Input
      {...restExplicitProps}
      ref={composedRef}
      id={inputId}
      type="text"
      role={isPickerPresent ? 'combobox' : undefined}
      aria-haspopup={isPickerPresent ? 'dialog' : undefined}
      aria-expanded={isPickerPresent ? isOpen : undefined}
      aria-controls={isPickerPresent ? pickerId : undefined}
      aria-autocomplete={isPickerPresent ? 'none' : undefined}
      aria-invalid={ariaInvalid}
      data-invalid={isInvalid ? 'true' : undefined}
      data-editing={isDirty ? 'true' : undefined}
      data-empty={isEmpty ? 'true' : undefined}
      data-reference-date-input=""
      data-reference-date-endpoint={endpoint}
      inputMode="text"
      autoComplete={explicitProps.autoComplete ?? 'off'}
      autoCorrect={explicitProps.autoCorrect ?? 'off'}
      spellCheck={explicitProps.spellCheck ?? false}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      placeholder={placeholder}
      value={displayText}
      onInput={explicitProps.onInput}
      onChange={onChangeComposed}
      onKeyDown={onKeyDownComposed}
      onFocus={onFocusComposed}
      onBlur={onBlurComposed}
      onClick={onClickComposed}
      onCompositionStart={onCompositionStartComposed}
      onCompositionEnd={onCompositionEndComposed}
      className={className}
      style={style}
    />
  )
}

function DateFieldRangeLayout() {
  const context = React.useContext(DateFieldRangeContext)
  const triggerSlot = useSlot('trigger')
  const pickerSlot = useSlot('picker')
  if (!context) return null

  const isPickerPresent = Boolean(pickerSlot)
  const { disabled, activeEndpoint, endpointRefs } = context

  let triggerNode: React.ReactNode = null
  if (triggerSlot || isPickerPresent) {
    const trigProps = (triggerSlot?.element.props as Record<string, any> | undefined) ?? {}
    const trigRef = triggerSlot?.meta?.ref as React.Ref<HTMLButtonElement> | undefined
    const isTriggerDisabled = trigProps.disabled ?? disabled

    const onTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      trigProps.onClick?.(e)
      if (!e.defaultPrevented && !isTriggerDisabled) {
        endpointRefs[activeEndpoint].current?.focus()
      }
    }

    const {
      onClick: _trigOnClick,
      disabled: _trigDisabled,
      tabIndex: _trigTabIndex,
      children: _trigChildren,
      ...restTrigProps
    } = trigProps

    triggerNode = (
      <Overlay.Trigger
        aria-haspopup="dialog"
        type="button"
        tabIndex={trigProps.tabIndex ?? -1}
        bg="transparent"
        border="none"
        p="0"
        width="6r"
        height="6r"
        minWidth="6r"
        marginInlineEnd="-2r"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        color="design.text.base"
        _hover={{ bg: 'gray.800', color: 'ui.field.foreground' }}
        borderRadius="sm"
        {...(restTrigProps as any)}
        ref={(node: HTMLButtonElement | null) => {
          if (typeof trigRef === 'function') {
            trigRef(node)
          } else if (trigRef && typeof trigRef === 'object') {
            ;(trigRef as React.RefObject<HTMLButtonElement | null>).current = node
          }
        }}
        disabled={isTriggerDisabled}
        data-reference-date-trigger=""
        onClick={onTriggerClick}
      >
        {trigProps.children ?? <CalendarTodayIcon />}
      </Overlay.Trigger>
    )
  }

  return (
    <>
      <RangeEndpointInput endpoint="start" />
      <RangeEndpointInput endpoint="end" />
      {triggerNode}
    </>
  )
}

function DateFieldRangePickerLayer() {
  const context = React.useContext(DateFieldRangeContext)
  const pickerSlot = useSlot('picker')
  if (!context || !pickerSlot) return null

  const {
    calendarValue,
    locale,
    min,
    max,
    isDateUnavailable,
    paneMonth,
    setPaneMonth,
    pickerId,
    handleRangeSelect,
  } = context

  const pickerProps = (pickerSlot.element.props as Record<string, any> | undefined) ?? {}
  const pickerRef = pickerSlot.meta?.ref as React.Ref<HTMLDivElement> | undefined
  const placement = pickerProps.placement ?? 'bottom-start'

  const {
    id: _pickerId,
    role: _pickerRole,
    placement: _pickerPlacement,
    children: _pickerChildren,
    ...restPickerProps
  } = pickerProps

  return (
    <Overlay.Content
      role="dialog"
      placement={placement}
      bg="ui.dialog.background"
      color="ui.dialog.foreground"
      borderRadius="md"
      boxShadow="0 4px 16px rgba(0,0,0,0.15)"
      border="1px solid"
      borderColor="ui.dialog.border"
      p="2r"
      {...(restPickerProps as any)}
      id={pickerId}
      data-reference-date-picker=""
      ref={(node: HTMLDivElement | null) => {
        if (typeof pickerRef === 'function') {
          pickerRef(node)
        } else if (pickerRef && typeof pickerRef === 'object') {
          ;(pickerRef as React.RefObject<HTMLDivElement | null>).current = node
        }
      }}
    >
      {pickerProps.children ?? (
        <Calendar
          mode="range"
          value={calendarValue}
          onChange={handleRangeSelect}
          locale={locale}
          min={min}
          max={max}
          isDateUnavailable={isDateUnavailable}
          month={paneMonth}
          onMonthChange={setPaneMonth}
        />
      )}
    </Overlay.Content>
  )
}

export const DateFieldRange = React.forwardRef<HTMLDivElement, DateFieldRangeProps>(
  function DateFieldRange(
    {
      children,
      value,
      onChange,
      locale,
      min,
      max,
      isDateUnavailable,
      disabled = false,
      readOnly = false,
      required = false,
      name,
      form,
      className,
      style,
      onKeyDown: rootOnKeyDown,
      onFocus: rootOnFocus,
      onBlur: rootOnBlur,
      onClick: rootOnClick,
      ...props
    },
    ref
  ) {
    if (locale == null) {
      throw new Error('[reference-ui] DateField.Range requires an explicit locale prop.')
    }
    assertValidDateBounds(min, max)
    if (value === undefined) {
      throw new Error(
        '[reference-ui] DateField.Range requires an explicit value prop (null is the empty value).'
      )
    }
    if (onChange == null) {
      throw new Error('[reference-ui] DateField.Range requires an explicit onChange prop.')
    }

    const formatEndpoint = React.useCallback(
      (iso: ISODate | null | undefined): string =>
        iso != null && isValidISODate(iso) ? formatLocalDate(iso, locale) : (iso ?? ''),
      [locale]
    )

    // Programmatic constraint-invalid per endpoint; a committed inverted
    // range is author error and marks both endpoints.
    const committedInverted =
      value != null && value.end != null && value.start > value.end
    const constraintInvalid: Record<DateFieldRangeEndpoint, boolean> = {
      start:
        committedInverted ||
        (value?.start != null &&
          isValidISODate(value.start) &&
          !isDateWithinConstraints(
            value.start,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          )),
      end:
        committedInverted ||
        (value?.end != null &&
          isValidISODate(value.end) &&
          !isDateWithinConstraints(
            value.end,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          )),
    }

    const [isOpen, setIsOpen] = React.useState(false)
    const [buffers, setBuffers] = React.useState<Record<DateFieldRangeEndpoint, string>>(() => ({
      start: value?.start != null && isValidISODate(value.start)
        ? formatLocalDate(value.start, locale)
        : (value?.start ?? ''),
      end: value?.end != null && isValidISODate(value.end)
        ? formatLocalDate(value.end, locale)
        : (value?.end ?? ''),
    }))
    const [isDirty, setIsDirty] = React.useState(false)
    const [failed, setFailed] = React.useState(false)
    const [resetEpoch, setResetEpoch] = React.useState(0)
    const [activeEndpoint, setActiveEndpoint] =
      React.useState<DateFieldRangeEndpoint>('start')
    const [paneMonth, setPaneMonthState] = React.useState<ISOMonth | undefined>(undefined)
    const composingRef = React.useRef<DateFieldRangeEndpoint | null>(null)

    const reactId = React.useId()
    const [pickerId] = React.useState(() => `datefield-range-picker-${reactId.replace(/:/g, '')}`)

    const fieldRef = React.useRef<HTMLDivElement | null>(null)
    const startInputRef = React.useRef<HTMLInputElement | null>(null)
    const endInputRef = React.useRef<HTMLInputElement | null>(null)
    const endpointRefs = React.useMemo(
      () => ({ start: startInputRef, end: endInputRef }),
      []
    )

    const setPaneMonth = React.useCallback((month: ISOMonth) => {
      setPaneMonthState(month)
    }, [])

    // Draft parse (render-derived): both endpoints parse independently; a
    // range applies only when both are complete, ordered, and constrained.
    const startParsed = parseLocalDate(buffers.start, locale)
    const endParsed = parseLocalDate(buffers.end, locale)
    const startValid = startParsed.valid && startParsed.iso != null
    const endValid = endParsed.valid && endParsed.iso != null
    const draftOrdered =
      startValid && endValid && (startParsed.iso as string) <= (endParsed.iso as string)
    const canApply =
      startValid &&
      endValid &&
      draftOrdered &&
      isDateWithinConstraints(
        startParsed.iso as CanonicalISODate,
        min as CanonicalISODate,
        max as CanonicalISODate,
        isDateUnavailable
      ) &&
      isDateWithinConstraints(
        endParsed.iso as CanonicalISODate,
        min as CanonicalISODate,
        max as CanonicalISODate,
        isDateUnavailable
      )

    // What the Calendar shows: the committed range when clean, else the
    // draft as a range when it is complete and ordered, a pending anchor
    // when only the start is complete (the machine is start-anchored), and
    // null otherwise — an end-only draft can never anchor (DF-RANGE-02).
    const calendarValue: DateRangeValue | null =
      isDirty || failed
        ? startValid && endValid
          ? draftOrdered
            ? { start: startParsed.iso as ISODate, end: endParsed.iso as ISODate }
            : null
          : startValid
            ? { start: startParsed.iso as ISODate, end: null }
            : null
        : value

    const draftEqualsCommitted = React.useCallback(
      (next: Record<DateFieldRangeEndpoint, string>): boolean => {
        const s = parseLocalDate(next.start, locale)
        const e = parseLocalDate(next.end, locale)
        if (!s.valid || !e.valid) return false
        if (value == null) return s.iso == null && e.iso == null
        return s.iso === value.start && (e.iso ?? null) === (value.end ?? null)
      },
      [value, locale]
    )

    // Authoritative value/locale replace: reformat both endpoints, end the
    // session, clear failure. Range reformats on accepted live echo too —
    // when draft and committed agree semantically there is nothing
    // pending, so the buffers normalize instead of preserving keystrokes.
    React.useEffect(() => {
      composingRef.current = null
      setBuffers({
        start:
          value?.start != null && isValidISODate(value.start)
            ? formatLocalDate(value.start, locale)
            : (value?.start ?? ''),
        end:
          value?.end != null && isValidISODate(value.end)
            ? formatLocalDate(value.end, locale)
            : (value?.end ?? ''),
      })
      setIsDirty(false)
      setFailed(false)
    }, [value, locale])

    const checkLivePublish = React.useCallback(
      (next: Record<DateFieldRangeEndpoint, string>) => {
        const s = parseLocalDate(next.start, locale)
        const e = parseLocalDate(next.end, locale)
        if (s.valid && s.iso == null && e.valid && e.iso == null) {
          if (value !== null) onChange(null)
          return
        }
        if (!s.valid || s.iso == null || !e.valid || e.iso == null) return
        if (s.iso > e.iso) return
        if (
          !isDateWithinConstraints(
            s.iso,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          ) ||
          !isDateWithinConstraints(
            e.iso,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          )
        ) {
          return
        }
        if (!rangesEqual({ start: s.iso, end: e.iso }, value)) {
          onChange({ start: s.iso, end: e.iso })
        }
      },
      [value, locale, min, max, isDateUnavailable, onChange]
    )

    const commitEndpoint = React.useCallback(
      (endpoint: DateFieldRangeEndpoint) => {
        if (composingRef.current) return
        if (!isDirty && !failed) return
        const other: DateFieldRangeEndpoint = endpoint === 'start' ? 'end' : 'start'
        const res = parseLocalDate(buffers[endpoint], locale)
        const otherRes = parseLocalDate(buffers[other], locale)

        if (res.valid && res.iso == null) {
          // A cleared endpoint is a legal draft state and never publishes
          // alone; emptying both publishes null once.
          if (otherRes.valid && otherRes.iso == null && value !== null) {
            onChange(null)
            setBuffers({ start: '', end: '' })
            setIsDirty(false)
            setFailed(false)
          } else if (draftEqualsCommitted(buffers)) {
            setIsDirty(false)
          }
          return
        }

        if (
          res.valid &&
          res.iso != null &&
          isDateWithinConstraints(
            res.iso,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          )
        ) {
          if (
            otherRes.valid &&
            otherRes.iso != null &&
            isDateWithinConstraints(
              otherRes.iso,
              min as CanonicalISODate,
              max as CanonicalISODate,
              isDateUnavailable
            )
          ) {
            const s = endpoint === 'start' ? res.iso : otherRes.iso
            const en = endpoint === 'start' ? otherRes.iso : res.iso
            if (s <= en) {
              if (!rangesEqual({ start: s, end: en }, value)) {
                onChange({ start: s, end: en })
              }
              setBuffers({
                start: formatLocalDate(s, locale),
                end: formatLocalDate(en, locale),
              })
              setIsDirty(false)
              setFailed(false)
              return
            }
            // Both complete but inverted: preserve the text, fail the
            // boundary — completion (not the commit) resolves it.
            setFailed(true)
            return
          }
          // This endpoint is valid; the other side is still being drafted.
          if (draftEqualsCommitted(buffers)) setIsDirty(false)
          return
        }

        // Incomplete, impossible, or out-of-constraints text reverts this
        // endpoint to committed state and fails the boundary.
        const committedEndpoint = value?.[endpoint] ?? null
        const next = {
          ...buffers,
          [endpoint]:
            committedEndpoint != null && isValidISODate(committedEndpoint)
              ? formatLocalDate(committedEndpoint, locale)
              : '',
        }
        setBuffers(next)
        setFailed(true)
        if (draftEqualsCommitted(next)) setIsDirty(false)
      },
      [buffers, isDirty, failed, value, locale, min, max, isDateUnavailable, onChange, draftEqualsCommitted]
    )

    const cancelRange = React.useCallback(() => {
      // Escape/Cancel: the draft restores to committed state with no
      // callback, and the picker closes.
      setBuffers({
        start: formatEndpoint(value?.start),
        end: formatEndpoint(value?.end),
      })
      setIsDirty(false)
      setFailed(false)
      setIsOpen(false)
    }, [value, formatEndpoint])

    const handleRangeSelect = React.useCallback(
      (next: DateRangeValue) => {
        if (
          !isDateWithinConstraints(
            next.start as CanonicalISODate,
            min as CanonicalISODate,
            max as CanonicalISODate,
            isDateUnavailable
          ) ||
          (next.end != null &&
            !isDateWithinConstraints(
              next.end as CanonicalISODate,
              min as CanonicalISODate,
              max as CanonicalISODate,
              isDateUnavailable
            ))
        ) {
          return
        }
        if (next.end == null) {
          // Pending anchor stays in the draft (never publishes): a Calendar
          // anchor click restarts the draft and clears the end buffer, so
          // the two-click gesture always completes on the second click.
          setBuffers({
            start: formatLocalDate(next.start as CanonicalISODate, locale),
            end: '',
          })
          setIsDirty(true)
          setFailed(false)
          setActiveEndpoint('end')
          return
        }
        if (!rangesEqual(next, value)) {
          onChange(next)
        }
        setBuffers({
          start: formatLocalDate(next.start as CanonicalISODate, locale),
          end: formatLocalDate(next.end as CanonicalISODate, locale),
        })
        setIsDirty(false)
        setFailed(false)
        setIsOpen(false)
      },
      [value, locale, min, max, isDateUnavailable, onChange]
    )

    const handleEndpointInput = React.useCallback(
      (endpoint: DateFieldRangeEndpoint, e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled || readOnly) return
        const next = { ...buffers, [endpoint]: e.target.value }
        setBuffers(next)
        setIsDirty(true)
        setFailed(false)
        // A complete typed endpoint moves the open pane without dismissing
        // (single-field DF-CAL-02 parity); partial text never moves it.
        const parsed = parseLocalDate(next[endpoint], locale)
        if (parsed.valid && parsed.iso != null) {
          setPaneMonthState(parsed.iso.slice(0, 7) as ISOMonth)
        }
        if (composingRef.current) return
        checkLivePublish(next)
      },
      [disabled, readOnly, buffers, locale, checkLivePublish]
    )

    const handleEndpointKeyDown = React.useCallback(
      (endpoint: DateFieldRangeEndpoint, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.defaultPrevented || disabled) return
        if (e.key === 'Enter') {
          commitEndpoint(endpoint)
        } else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'Down')) {
          e.preventDefault()
          setIsOpen(true)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          cancelRange()
        } else if (
          (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Up' || e.key === 'Down') &&
          !e.altKey &&
          !readOnly
        ) {
          // Per-endpoint caret stepping: same contract as the single field.
          const committedEndpoint = value?.[endpoint] ?? null
          const text = isDirty
            ? buffers[endpoint]
            : committedEndpoint != null && isValidISODate(committedEndpoint)
              ? formatLocalDate(committedEndpoint, locale)
              : ''
          const base = isDirty
            ? parseLocalDate(buffers[endpoint], locale)
            : committedEndpoint != null && isValidISODate(committedEndpoint)
              ? { valid: true, iso: committedEndpoint as ISODate }
              : { valid: false, iso: null as ISODate | null }
          if (!base.valid || base.iso == null) return
          const input =
            endpointRefs[endpoint].current ?? (e.target as HTMLInputElement | null)
          const caret = input?.selectionStart ?? text.length
          const segment = getSegmentAtCaret(text, caret, locale)
          const delta =
            (e.key === 'ArrowUp' || e.key === 'Up' ? 1 : -1) * (e.shiftKey ? 10 : 1)
          const stepped = stepDateSegment(base.iso as CanonicalISODate, segment, delta)
          if (stepped == null) return
          if (
            !isDateWithinConstraints(
              stepped,
              min as CanonicalISODate,
              max as CanonicalISODate,
              isDateUnavailable
            )
          ) {
            return
          }
          e.preventDefault()
          const next = { ...buffers, [endpoint]: formatLocalDate(stepped, locale) }
          setBuffers(next)
          setIsDirty(true)
          setFailed(false)
          setPaneMonthState(stepped.slice(0, 7) as ISOMonth)
          checkLivePublish(next)
          const caretPos = Math.min(caret, next[endpoint].length)
          const target = input
          const restoreCaret = () => {
            try {
              target?.setSelectionRange(caretPos, caretPos)
            } catch {
              // Non-text selection contexts (tests) ignore caret restore.
            }
          }
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(restoreCaret)
          } else {
            restoreCaret()
          }
        }
      },
      [
        disabled,
        readOnly,
        commitEndpoint,
        cancelRange,
        isDirty,
        buffers,
        value,
        locale,
        min,
        max,
        isDateUnavailable,
        checkLivePublish,
        endpointRefs,
      ]
    )

    const handleEndpointBlur = React.useCallback(
      (endpoint: DateFieldRangeEndpoint, e: React.FocusEvent<HTMLInputElement>) => {
        if (e.defaultPrevented) return
        commitEndpoint(endpoint)
      },
      [commitEndpoint]
    )

    const handleEndpointFocus = React.useCallback(
      (endpoint: DateFieldRangeEndpoint) => {
        // The Calendar pane follows the focused endpoint (DF-RANGE-03).
        setActiveEndpoint(endpoint)
        const parsed = parseLocalDate(buffers[endpoint], locale)
        const effective =
          parsed.valid && parsed.iso != null ? parsed.iso : (value?.[endpoint] ?? null)
        if (effective != null && isValidISODate(effective)) {
          setPaneMonthState(effective.slice(0, 7) as ISOMonth)
        }
      },
      [buffers, locale, value]
    )

    const handleEndpointClick = React.useCallback(
      (_endpoint: DateFieldRangeEndpoint) => {
        if (disabled) return
        setIsOpen(true)
      },
      [disabled]
    )

    const handleCompositionStart = React.useCallback((endpoint: DateFieldRangeEndpoint) => {
      composingRef.current = endpoint
    }, [])

    const handleCompositionEnd = React.useCallback((endpoint: DateFieldRangeEndpoint) => {
      if (composingRef.current !== endpoint) return
      composingRef.current = null
    }, [])

    // Form observers mirror the single field: a failed boundary blocks
    // until resolution; dirty submits process once then block for retry;
    // reset reformats both endpoints without touching controlled state.
    React.useEffect(() => {
      const input = startInputRef.current
      const form = input?.form ?? null
      if (!input || !form || disabled) return
      const onSubmit = (submitEvent: Event) => {
        if (readOnly || submitEvent.defaultPrevented) return
        if (failed) {
          submitEvent.preventDefault()
          return
        }
        if (isDirty) {
          commitEndpoint('start')
          commitEndpoint('end')
          submitEvent.preventDefault()
        }
      }
      const onReset = (resetEvent: Event) => {
        if (resetEvent.defaultPrevented) return
        setBuffers({
          start: formatEndpoint(value?.start),
          end: formatEndpoint(value?.end),
        })
        setIsDirty(false)
        setFailed(false)
        setResetEpoch((epoch) => epoch + 1)
        const target = endpointRefs[activeEndpoint].current
        const caretToEnd = () => {
          try {
            target?.focus()
            const end = target?.value.length ?? 0
            target?.setSelectionRange(end, end)
          } catch {
            // Non-text selection contexts (tests) ignore caret placement.
          }
        }
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(caretToEnd)
        } else {
          caretToEnd()
        }
      }
      form.addEventListener('submit', onSubmit)
      form.addEventListener('reset', onReset)
      return () => {
        form.removeEventListener('submit', onSubmit)
        form.removeEventListener('reset', onReset)
      }
    })

    const rootHandlers = React.useMemo(
      () => ({
        onKeyDown: rootOnKeyDown as
          | ((e: React.KeyboardEvent<HTMLInputElement>) => void)
          | undefined,
        onFocus: rootOnFocus as
          | ((e: React.FocusEvent<HTMLInputElement>) => void)
          | undefined,
        onBlur: rootOnBlur as ((e: React.FocusEvent<HTMLInputElement>) => void) | undefined,
        onClick: rootOnClick as ((e: React.MouseEvent<HTMLInputElement>) => void) | undefined,
      }),
      [rootOnKeyDown, rootOnFocus, rootOnBlur, rootOnClick]
    )

    const contextValue = React.useMemo<DateFieldRangeContextValue>(
      () => ({
        rangeValue: value,
        calendarValue,
        locale,
        min,
        max,
        isDateUnavailable,
        isOpen,
        canApply,
        activeEndpoint,
        disabled,
        readOnly,
        required,
        pickerId,
        paneMonth,
        setPaneMonth,
        endpointRefs,
        buffers,
        isDirty,
        failed,
        constraintInvalid,
        handleRangeSelect,
        handleEndpointInput,
        handleEndpointKeyDown,
        handleEndpointBlur,
        handleEndpointFocus,
        handleEndpointClick,
        handleCompositionStart,
        handleCompositionEnd,
        rootHandlers,
      }),
      [
        value,
        calendarValue,
        locale,
        min,
        max,
        isDateUnavailable,
        isOpen,
        canApply,
        activeEndpoint,
        disabled,
        readOnly,
        required,
        pickerId,
        paneMonth,
        setPaneMonth,
        endpointRefs,
        buffers,
        isDirty,
        failed,
        constraintInvalid,
        handleRangeSelect,
        handleEndpointInput,
        handleEndpointKeyDown,
        handleEndpointBlur,
        handleEndpointFocus,
        handleEndpointClick,
        handleCompositionStart,
        handleCompositionEnd,
        rootHandlers,
      ]
    )

    const composedFieldRef = (node: HTMLDivElement | null) => {
      fieldRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref && typeof ref === 'object') {
        ;(ref as React.RefObject<HTMLDivElement | null>).current = node
      }
    }

    // A string name serializes both endpoints under one name
    // (`FormData.getAll` yields `[start, end]`); the object form splits them.
    const startFormName = typeof name === 'string' ? name : name?.start
    const endFormName = typeof name === 'string' ? name : name?.end

    return (
      <DateFieldSlotProvider>
        <DateFieldRangeContext.Provider value={contextValue}>
          <Overlay open={isOpen} onOpenChange={setIsOpen} anchor={fieldRef} isolation={false}>
            <Div
              ref={composedFieldRef}
              data-reference-field=""
              data-can-apply={canApply ? 'true' : 'false'}
              data-active-endpoint={activeEndpoint}
              display="inline-flex"
              alignItems="center"
              width="100%"
              className={className}
              style={style}
              {...props}
            >
              {children}
              <DateFieldRangeLayout />
            </Div>
            <DateFieldRangePickerLayer />
            {startFormName && !disabled && (
              <input
                key={`hidden-start-${resetEpoch}`}
                type="hidden"
                name={startFormName}
                value={value?.start ?? ''}
                form={form}
              />
            )}
            {endFormName && !disabled && (
              <input
                key={`hidden-end-${resetEpoch}`}
                type="hidden"
                name={endFormName}
                value={value?.end ?? ''}
                form={form}
              />
            )}
          </Overlay>
        </DateFieldRangeContext.Provider>
      </DateFieldSlotProvider>
    )
  }
)
DateFieldRange.displayName = 'DateFieldRange'

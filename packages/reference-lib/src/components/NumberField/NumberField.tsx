import * as React from 'react'
import { Div, Input, Button, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'

setupFocusVisible()

// Float-drift cleanup ported verbatim from quarantine (NF-MATH-07/08/14):
// snaps ordinary decimal stepping (0.1 + 0.2) back to the representable
// value only when within float epsilon, and canonicalizes -0 to 0.
function cleanFloat(value: number): number {
  if (!Number.isFinite(value)) return value
  const rounded = parseFloat(value.toPrecision(15))
  if (
    Math.abs(rounded - value) <=
    Math.min(Number.EPSILON * Math.max(1, Math.abs(value)), 1e-10)
  ) {
    return Object.is(rounded, -0) ? 0 : rounded
  }
  return Object.is(value, -0) ? 0 : value
}

// Step-precision rounding ported from React Spectrum's
// react-stately/src/utils/number.ts (roundToStepPrecision): keeps snap math
// on the representable lattice instead of accumulating binary noise.
function roundToStepPrecision(value: number, step: number): number {
  let roundedValue = value
  let precision = 0
  const stepString = step.toString()
  const eIndex = stepString.toLowerCase().indexOf('e-')
  if (eIndex > 0) {
    precision = Math.abs(Math.floor(Math.log10(Math.abs(step)))) + eIndex
  } else {
    const pointIndex = stepString.indexOf('.')
    if (pointIndex >= 0) {
      precision = stepString.length - pointIndex
    }
  }
  if (precision > 0) {
    const pow = Math.pow(10, precision)
    roundedValue = Math.round(roundedValue * pow) / pow
  }
  return roundedValue
}

// W-02 snap: React Spectrum's snapValueToStep with one deliberate change —
// midpoint ties go round-half-up (toward +Infinity) per the signed-off W-02
// acceptance; upstream moves ties by Math.sign(remainder). Lattice anchoring
// (finite min, else 0) and the lattice-clamped maximum are upstream-verbatim,
// which differs from TESTS.md's zero-anchored freeze with preserved non-grid
// endpoints (flagged for HQ in the mission log).
function snapValueToLattice(value: number, min: number | undefined, max: number | undefined, step: number): number {
  const anchor = min === undefined ? 0 : min
  // cleanFloat stabilizes float-quotient ties (0.075/0.05 reads
  // 1.4999999999999998) before the half-up decision.
  const snappedQuotient = Math.floor(cleanFloat((value - anchor) / step) + 0.5)
  let snappedValue = roundToStepPrecision(anchor + snappedQuotient * step, step)

  if (min !== undefined) {
    if (snappedValue < min) {
      snappedValue = min
    } else if (max !== undefined && snappedValue > max) {
      snappedValue = min + Math.floor(roundToStepPrecision((max - min) / step, step)) * step
    }
  } else if (max !== undefined && snappedValue > max) {
    snappedValue = Math.floor(roundToStepPrecision(max / step, step)) * step
  }

  return roundToStepPrecision(snappedValue, step)
}

function isOnStepLattice(
  value: number,
  min: number | undefined,
  max: number | undefined,
  step: number
): boolean {
  const snapped = snapValueToLattice(value, min, max, step)
  return roundToStepPrecision(snapped - value, step) === 0
}

// Shallow format-options equality ported from React Spectrum's
// useNumberFieldState: every Intl.NumberFormatOptions member is a primitive,
// so a referentially new but effectively equal object must not reset state.
function isEqualFormatOptions(
  a: Intl.NumberFormatOptions | undefined,
  b: Intl.NumberFormatOptions | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  for (const key of aKeys) {
    if ((b as Record<string, unknown>)[key] !== (a as Record<string, unknown>)[key]) return false
  }
  return true
}

interface DraftNumberSymbols {
  group: string | null
  decimal: string
}

function draftNumberSymbols(locale: string): DraftNumberSymbols {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.89)
  return {
    group: parts.find(part => part.type === 'group')?.value ?? null,
    decimal: parts.find(part => part.type === 'decimal')?.value ?? '.',
  }
}

// Leading/trailing runs stripped before the numeric core is validated:
// whitespace (incl. NBSP group variants), currency symbols, percent marks,
// and formatter-inserted bidi controls. Interior junk stays and fails.
const DRAFT_STRIP_RUN = /^[\s\p{Sc}%\u2030\u200E\u200F\u061C]+|[\s\p{Sc}%\u2030\u200E\u200F\u061C]+$/gu
const DRAFT_EXPONENT_SUFFIX = /[eE][+-]?\d+$/
const DRAFT_ASCII_DIGITS = /^[0-9]+$/

function isValidGroupHead(segments: string[]): boolean {
  // Strict 3-digit grouping only (en-IN 3-2-2 stays NF-PARSE-17): every
  // group separator must sit between valid digit runs, so foreign
  // punctuation ("2.5" under de-DE) is rejected, never reinterpreted.
  if (segments.length === 1) return true
  if (!DRAFT_ASCII_DIGITS.test(segments[0]) || segments[0].length > 3) return false
  for (let index = 1; index < segments.length; index += 1) {
    if (!/^[0-9]{3}$/.test(segments[index])) return false
  }
  return true
}

// W-25 commit parser: ASCII digits with locale group/decimal normalization,
// a single leading sign, and an optional ASCII exponent. Percent style
// scales the result (1/100, 1/1000 for permille) per React Aria's parser.
// Returns NaN for anything else: foreign punctuation placement, hex-able
// prefixes are still honored via Number(), currency codes, unit names,
// non-ASCII digits, accounting parens, or nonfinite results.
function parseDraftNumber(text: string, symbols: DraftNumberSymbols, percentStyle: boolean): number {
  const stripped = text.trim().replace(DRAFT_STRIP_RUN, '')
  if (stripped === '') return NaN
  // Percent marks are grammar only in percent style; elsewhere the affix
  // strip already removed them, so their presence in the raw text rejects.
  const affix = text.trim().replace(stripped, '')
  const hasPercent = affix.includes('%')
  const hasPermille = affix.includes('\u2030')
  if ((hasPercent || hasPermille) && !percentStyle) return NaN

  let core = stripped
  let sign = ''
  if (core.startsWith('+') || core.startsWith('-')) {
    sign = core.slice(0, 1)
    core = core.slice(1)
  }
  let exponent = ''
  const exponentMatch = core.match(DRAFT_EXPONENT_SUFFIX)
  if (exponentMatch) {
    exponent = exponentMatch[0]
    core = core.slice(0, core.length - exponent.length)
  }
  // A second sign outside the exponent is never valid ("++5", "5-3").
  if (core.includes('+') || core.includes('-')) return NaN

  let head = core
  let tail: string | null = null
  const decimalIndex = core.indexOf(symbols.decimal)
  if (decimalIndex >= 0) {
    head = core.slice(0, decimalIndex)
    tail = core.slice(decimalIndex + symbols.decimal.length)
    // One decimal separator only; group separators never follow it.
    if (tail.includes(symbols.decimal)) return NaN
    if (symbols.group !== null && tail.includes(symbols.group)) return NaN
  }
  // Space-group locales (fr-FR) accept keyboard spaces as the group
  // separator — the Intl narrow-NBSP exists on no keyboard. Position
  // validation still applies, so "1 2" stays invalid.
  if (symbols.group !== null && /^\s$/.test(symbols.group)) {
    head = head.replace(/[\u0020\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, symbols.group)
  }
  let headDigits = head
  if (symbols.group !== null && head.includes(symbols.group)) {
    const segments = head.split(symbols.group)
    if (!isValidGroupHead(segments)) return NaN
    headDigits = segments.join('')
  }
  if (headDigits === '' && (tail === null || tail === '') && exponent === '') return NaN
  const normalized = sign + headDigits + (tail === null ? '' : `.${tail}`) + exponent
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return NaN
  if (!percentStyle) return parsed
  return hasPermille ? parsed / 1000 : parsed / 100
}

// W-02: explicit commit policy. 'snap' coerces typed commits to the step
// lattice within min/max; 'validate' rejects off-step/out-of-range commits
// (revert + onInvalidCommit, no onChange); 'none' keeps historic behavior
// (clamp, never snap or reject). Prop name and snap/validate pair mirror
// React Aria NumberField verbatim; the default ('none') and third value are
// ours (WANTS.md W-02).
export type NumberFieldCommitBehavior = 'snap' | 'validate' | 'none'

export type NumberFieldInvalidCommitReason = 'off-step' | 'out-of-range'

export type NumberFieldProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  value: number | null
  onChange?: (value: number | null) => void
  locale: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  // W-25: Intl display formatting. The committed value stays a plain
  // number; only the clean (non-editing) rendering is formatted.
  formatOptions?: Intl.NumberFormatOptions
  commitBehavior?: NumberFieldCommitBehavior
  onInvalidCommit?: (attempted: number, reason: NumberFieldInvalidCommitReason) => void
}

interface NumberFieldContextValue {
  value: number | null
  // W-25: clean-state rendered text (Intl formatting of the controlled
  // value). The Input shows the verbatim draft while dirty, this otherwise.
  displayValue: string
  min?: number
  max?: number
  step: number
  disabled: boolean
  // B-19: transient edit buffer; null means clean (input shows formatted
  // controlled value). Typing only writes the draft — commit boundaries
  // (blur, Enter, step actions) publish, never mid-keystroke.
  draft: string | null
  increment: (factor?: number) => void
  decrement: (factor?: number) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  commitDraft: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  focusInput: () => void
}

const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(null)

export type NumberFieldInputProps = PrimitiveProps<'input'>

export const NumberFieldInput = React.forwardRef<HTMLInputElement, NumberFieldInputProps>(
  function NumberFieldInput(
    {
      className,
      style,
      onKeyDown: userOnKeyDown,
      onChange: userOnChange,
      onFocus: userOnFocus,
      onBlur: userOnBlur,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) return null

    const { displayValue, disabled, draft, handleInputChange, handleKeyDown, commitDraft, inputRef } = context

    // Managed authority (NF-TYPE-03, NF-DOM-06): behavior-owned props are
    // stripped so conflicting consumer casts cannot break the field.
    // B-26 / SPEC: Input keeps plain textbox semantics — no role recast,
    // no numeric aria-value* — so stripping also enforces their absence.
    // Unrelated props (readOnly, aria-invalid, aria-label, data-*) pass
    // through untouched (NF-DOM-05).
    const {
      type: _managedType,
      role: _managedRole,
      value: _managedValue,
      defaultValue: _managedDefaultValue,
      inputMode: _managedInputMode,
      min: _managedMin,
      max: _managedMax,
      step: _managedStep,
      disabled: _managedDisabled,
      'aria-valuenow': _managedNow,
      'aria-valuemin': _managedMinAttr,
      'aria-valuemax': _managedMaxAttr,
      'aria-valuetext': _managedText,
      ...restProps
    } = props as Record<string, unknown>

    const setInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        if (inputRef) {
          ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
      },
      [ref, inputRef]
    )

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      userOnKeyDown?.(e)
      if (!e.defaultPrevented) {
        handleKeyDown(e)
      }
    }

    // Consumer edit handlers run first in native order; cancellation at the
    // cancelable boundary suppresses managed work (NF-EDIT-13, NF-KEY-07).
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      userOnChange?.(e)
      if (!e.defaultPrevented) {
        handleInputChange(e)
      }
    }

    // Blur is a commit boundary: the consumer observes first and can veto
    // the commit with preventDefault, leaving the dirty buffer intact.
    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      userOnBlur?.(e)
      if (!e.defaultPrevented) {
        commitDraft()
      }
    }

    return (
      <Input
        ref={setInputRef}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={draft ?? displayValue}
        data-editing={draft !== null ? '' : undefined}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={userOnFocus}
        onBlur={onBlur}
        className={className}
        style={style}
        {...restProps}
      />
    )
  }
)

// Hold-repeat constants (PATCHES §7 / freeze decision 14): an unprevented
// primary pointerdown steps immediately, the first repeat fires at exactly
// 400ms, then every 60ms; touch/pen movement beyond 8 CSS px cancels.
const REPEAT_START_DELAY = 400
const REPEAT_TICK_DELAY = 60
const TOUCH_CANCEL_DISTANCE_SQ = 8 * 8

function isTouchLikePointerType(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}

interface StepperRepeatSession {
  pointerId: number
  pointerType: string
  factor: number
  startX: number
  startY: number
  delayTimer: ReturnType<typeof setTimeout> | null
  intervalTimer: ReturnType<typeof setInterval> | null
  ownerWindow: Window | null
  onOwnerBlur: (() => void) | null
}

type StepperRepeatEndReason = 'release' | 'leave' | 'cancel'

interface StepperRepeatUserHandlers {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>
  onPointerUp?: React.PointerEventHandler<HTMLButtonElement>
  onPointerMove?: React.PointerEventHandler<HTMLButtonElement>
  onPointerEnter?: React.PointerEventHandler<HTMLButtonElement>
  onPointerLeave?: React.PointerEventHandler<HTMLButtonElement>
  onPointerCancel?: React.PointerEventHandler<HTMLButtonElement>
  onLostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>
}

// Shared press-and-hold machine for both steppers (NF-STEP-02..08/10/12..15):
// each step calls the root action once, which commits any dirty candidate
// as its base and ends the edit session (B-19 commit boundary).
// No explicit pointer capture: leave must end the session (NF-STEP-07).
function useStepperRepeat(options: {
  action: ((factor: number) => void) | undefined
  focusInput: (() => void) | undefined
  disabled: boolean
  atBound: boolean
  user: StepperRepeatUserHandlers
}) {
  const { action, focusInput, disabled, atBound, user } = options
  const [pressed, setPressed] = React.useState(false)
  const sessionRef = React.useRef<StepperRepeatSession | null>(null)
  const suppressClickRef = React.useRef(false)
  const reentryArmedRef = React.useRef(false)
  const disarmReentryRef = React.useRef<(() => void) | null>(null)
  // Timer ticks must step from the latest committed value, so they read
  // through a ref mirror refreshed every render (context callbacks rebind).
  const actionRef = React.useRef(action)
  actionRef.current = action

  const clearSessionTimers = React.useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    if (session.delayTimer !== null) {
      clearTimeout(session.delayTimer)
      session.delayTimer = null
    }
    if (session.intervalTimer !== null) {
      clearInterval(session.intervalTimer)
      session.intervalTimer = null
    }
    if (session.ownerWindow && session.onOwnerBlur) {
      session.ownerWindow.removeEventListener('blur', session.onOwnerBlur)
      session.onOwnerBlur = null
    }
  }, [])

  const endSession = React.useCallback(
    (reason: StepperRepeatEndReason) => {
      const session = sessionRef.current
      if (!session) return
      clearSessionTimers()
      sessionRef.current = null
      setPressed(false)
      // Only leave disarms: the pointer is off the button so no compatibility
      // click can follow. Release/cancel arm suppression for the click the
      // browser may still deliver (NF-STEP-03/06/15).
      suppressClickRef.current = reason !== 'leave'
      disarmReentryRef.current?.()
      disarmReentryRef.current = null
      if (reason !== 'leave') {
        reentryArmedRef.current = false
        return
      }
      // Leave arms pressed re-entry (NF-STEP-08). Any release anywhere
      // disarms, so drags starting on other elements never step.
      reentryArmedRef.current = true
      const win = session.ownerWindow
      if (win) {
        const disarm = () => {
          reentryArmedRef.current = false
          disarmReentryRef.current = null
        }
        disarmReentryRef.current = () => win.removeEventListener('pointerup', disarm)
        win.addEventListener('pointerup', disarm, { once: true })
      }
    },
    [clearSessionTimers]
  )

  const startSession = (e: React.PointerEvent<HTMLButtonElement>, factor: number) => {
    // Silent replace: clear any previous session's timers/listeners without
    // touching pressed or suppression (pressed re-entry, NF-STEP-08).
    clearSessionTimers()
    disarmReentryRef.current?.()
    disarmReentryRef.current = null
    reentryArmedRef.current = false
    const ownerWindow = e.currentTarget.ownerDocument?.defaultView ?? null
    const session: StepperRepeatSession = {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      factor,
      startX: e.clientX,
      startY: e.clientY,
      delayTimer: null,
      intervalTimer: null,
      ownerWindow,
      onOwnerBlur: null,
    }
    sessionRef.current = session
    suppressClickRef.current = true
    setPressed(true)
    if (ownerWindow) {
      const onOwnerBlur = () => endSession('cancel')
      session.onOwnerBlur = onOwnerBlur
      ownerWindow.addEventListener('blur', onOwnerBlur)
    }
    // Immediate step (NF-STEP-03); the initiating modifier is retained for
    // the whole hold because ticks reuse the stored factor.
    actionRef.current?.(factor)
    // Mouse activation focuses or retains Input; touch/pen must not force
    // focus and pop the software keyboard (NF-STEP-10).
    if (!isTouchLikePointerType(e.pointerType)) {
      focusInput?.()
    }
    session.delayTimer = setTimeout(() => {
      if (sessionRef.current !== session) return
      actionRef.current?.(session.factor)
      session.intervalTimer = setInterval(() => {
        if (sessionRef.current !== session) return
        actionRef.current?.(session.factor)
      }, REPEAT_TICK_DELAY)
    }, REPEAT_START_DELAY)
  }

  // Unmount/part removal ends the session with no stale callback (NF-STEP-14).
  React.useEffect(() => {
    return () => {
      clearSessionTimers()
      sessionRef.current = null
      disarmReentryRef.current?.()
      disarmReentryRef.current = null
    }
  }, [clearSessionTimers])

  // Disable, part-disable, or reaching the bound ends an active hold
  // immediately with no late callback (NF-STEP-13, adapted: this engine has
  // no readOnly prop — that branch lands with PATCHES §5).
  React.useEffect(() => {
    if (sessionRef.current && (disabled || atBound)) {
      endSession('cancel')
    }
  }, [disabled, atBound, endSession])

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerDown?.(e)
    // A fresh physical press voids any pending compat-click expectation.
    suppressClickRef.current = false
    reentryArmedRef.current = false
    disarmReentryRef.current?.()
    disarmReentryRef.current = null
    // Secondary/auxiliary buttons stay native, never step (NF-STEP-09).
    if (e.button !== 0) return
    if (disabled || e.defaultPrevented || !action) return
    if (!e.isPrimary) {
      // A second pointer while held is the pinch branch: cancel the active
      // session, never start another (NF-STEP-15).
      if (sessionRef.current) endSession('cancel')
      return
    }
    e.preventDefault()
    startSession(e, e.shiftKey ? 10 : 1)
  }

  const handlePointerMove: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerMove?.(e)
    const session = sessionRef.current
    if (!session || e.pointerId !== session.pointerId) return
    // Only touch/pen movement cancels; mouse uses leave (NF-STEP-15).
    if (!isTouchLikePointerType(session.pointerType)) return
    const dx = session.startX - e.clientX
    const dy = session.startY - e.clientY
    // Squared comparison: exactly 8px retains, beyond 8px cancels.
    if (dx * dx + dy * dy > TOUCH_CANCEL_DISTANCE_SQ) {
      endSession('cancel')
    }
  }

  const endMatchingSession = (e: React.PointerEvent<HTMLButtonElement>, reason: StepperRepeatEndReason) => {
    const session = sessionRef.current
    if (!session || e.pointerId !== session.pointerId) return
    endSession(reason)
  }

  const handlePointerUp: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerUp?.(e)
    endMatchingSession(e, 'release')
  }

  const handlePointerCancel: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerCancel?.(e)
    endMatchingSession(e, 'cancel')
  }

  const handleLostPointerCapture: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onLostPointerCapture?.(e)
    endMatchingSession(e, 'cancel')
  }

  const handlePointerLeave: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerLeave?.(e)
    endMatchingSession(e, 'leave')
  }

  const handlePointerEnter: React.PointerEventHandler<HTMLButtonElement> = e => {
    user.onPointerEnter?.(e)
    if (sessionRef.current) return
    if ((e.buttons & 1) === 0) {
      // Button-less hover disarms stale re-entry (release outside the window).
      reentryArmedRef.current = false
      return
    }
    if (!reentryArmedRef.current) return
    if (disabled || !action) return
    if (!e.isPrimary) return
    // Pressed re-entry steps immediately with a fresh 400ms delay; it never
    // resumes the old 60ms cadence (NF-STEP-08).
    startSession(e, e.shiftKey ? 10 : 1)
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    user.onClick?.(e)
    // Compatibility click after an owned pointer session never duplicates
    // the pointerdown step (NF-STEP-03/10).
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (e.button !== 0) return
    if (disabled || e.defaultPrevented || !action) return
    // Keyboard, AT, and programmatic activation without an owned pointerdown
    // performs exactly one step (NF-STEP-02); Shift selects the fixed coarse
    // delta while Alt never creates another amount.
    action(e.shiftKey ? 10 : 1)
    focusInput?.()
  }

  return {
    pressed,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handlePointerEnter,
    handlePointerCancel,
    handleLostPointerCapture,
    handleClick,
  }
}

// PATCHES §6 / freeze decision 12: each stepper requires an authored
// nonempty accessible-name prop — the aria-label | aria-labelledby union
// (nonempty). Shape mirrors NumberField.md NumberFieldStepperName; runtime
// emptiness is diagnosed separately per NF-TYPE-04.
export type NumberFieldStepperName =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string }

export type NumberFieldIncrementProps = Omit<PrimitiveProps<'button'>, 'aria-label' | 'aria-labelledby'> &
  NumberFieldStepperName

// Dev-only diagnostic writer (Combobox/Splitter globalProcess pattern:
// the package declares no node types, so process comes via globalThis).
const globalProcess = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process

function numberFieldDevDiagnostic(message: string) {
  if (globalProcess?.env?.NODE_ENV === 'production') return
  console.error(`Reference UI: NumberField ${message}`)
}

// Layout effect where a window exists, passive effect under SSR (avoids the
// server useLayoutEffect warning for labelledby verification).
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

function stepperNameText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

function stepperNameIds(labelledbyText: string): string[] {
  const trimmed = labelledbyText.trim()
  return trimmed === '' ? [] : trimmed.split(/\s+/)
}

// PATCHES §6 runtime: missing, empty, or unresolved stepper naming fails
// with a descriptive dev diagnostic; the offender renders nothing and so
// neither registers nor activates (no registration system exists until §4).
// Labelledby targets only exist in committed DOM, so verification runs in a
// layout effect: the first paint assumes named (SSR/hydration-safe) and an
// unresolved name hides pre-paint. Targets must be committed with the
// stepper — a later-mounting target with unchanged props does not re-verify.
// Effective-name semantics follow the
// platform: a present labelledby overrides aria-label, so it must resolve
// to a nonempty name even when a label is also authored.
function useStepperName(kind: 'Increment' | 'Decrement', ariaLabel: unknown, ariaLabelledby: unknown): boolean {
  const labelValid = stepperNameText(ariaLabel).trim() !== ''
  const labelledbyText = stepperNameText(ariaLabelledby)
  const usesLabelledby = stepperNameIds(labelledbyText).length > 0
  const [labelledbyValid, setLabelledbyValid] = React.useState<boolean | null>(null)
  const loggedRef = React.useRef(false)

  useIsomorphicLayoutEffect(() => {
    if (!usesLabelledby || typeof document === 'undefined') return
    const ids = stepperNameIds(labelledbyText)
    const elements = ids.map(id => document.getElementById(id))
    const name = elements
      .map(el => (el === null ? '' : el.getAttribute('aria-label') || el.textContent || ''))
      .join(' ')
    setLabelledbyValid(elements.every(el => el !== null) && name.trim() !== '')
  }, [usesLabelledby, labelledbyText])

  let named = true
  let reason = ''
  if (usesLabelledby) {
    if (labelledbyValid === false) {
      named = false
      reason =
        `${kind} has an "aria-labelledby" that does not resolve to a nonempty accessible name ` +
        `("${labelledbyText}") — the stepper was not rendered and will not activate.`
    }
  } else if (!labelValid) {
    named = false
    reason =
      `${kind} requires a nonempty authored "aria-label" or a resolving "aria-labelledby" — ` +
      `no English fallback exists, so the stepper was not rendered and will not activate.`
  }

  useIsomorphicLayoutEffect(() => {
    if (named || loggedRef.current) return
    loggedRef.current = true
    numberFieldDevDiagnostic(reason)
  }, [named, reason])

  return named
}

export const NumberFieldIncrement = React.forwardRef<HTMLButtonElement, NumberFieldIncrementProps>(
  function NumberFieldIncrement(
    {
      children,
      className,
      style,
      onClick,
      onPointerDown,
      onPointerUp,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      onPointerCancel,
      onLostPointerCapture,
      type: _managedType,
      tabIndex: _managedTabIndex,
      'data-pressed': _managedPressed,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      disabled: authoredDisabled,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)

    // Capability follows root state or authored disabled (NF-STEP-11);
    // structural type/tabIndex stay managed (NF-TYPE-03); the accessible
    // name is required, validated, and passed through explicitly.
    const isDisabled = context?.disabled || authoredDisabled || false
    const value = context?.value ?? null
    const max = context?.max

    // Required-name gate (PATCHES §6): hooks run unconditionally so
    // named↔unnamed transitions never change the hook count; the null
    // return below is the "neither registers nor activates" branch.
    const named = useStepperName('Increment', ariaLabel, ariaLabelledby)

    // Press-and-hold stepping (PATCHES §7): consumer handlers chain first
    // inside the hook, so authored pointer props can never clobber the
    // session machine via the trailing spread.
    const repeat = useStepperRepeat({
      action: context ? context.increment : undefined,
      focusInput: context?.focusInput,
      disabled: isDisabled,
      atBound: value !== null && max !== undefined && value >= max,
      user: {
        onClick,
        onPointerDown,
        onPointerUp,
        onPointerMove,
        onPointerEnter,
        onPointerLeave,
        onPointerCancel,
        onLostPointerCapture,
      },
    })

    if (!named) return null

    return (
      <Button
        ref={ref}
        type="button"
        tabIndex={-1}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        disabled={isDisabled}
        data-pressed={repeat.pressed ? '' : undefined}
        onClick={repeat.handleClick}
        onPointerDown={repeat.handlePointerDown}
        onPointerUp={repeat.handlePointerUp}
        onPointerMove={repeat.handlePointerMove}
        onPointerEnter={repeat.handlePointerEnter}
        onPointerLeave={repeat.handlePointerLeave}
        onPointerCancel={repeat.handlePointerCancel}
        onLostPointerCapture={repeat.handleLostPointerCapture}
        height="100%"
        aspectRatio="1 / 1"
        p="0"
        m="0"
        border="none"
        bg="transparent"
        borderRadius="sm"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        color="design.text.base"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        outline="none"
        _hover={!isDisabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
        _active={!isDisabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={{
          aspectRatio: '1 / 1',
          height: '100%',
          margin: 0,
          ...style,
        }}
        {...props}
      >
        {children ?? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </Button>
    )
  }
)

export type NumberFieldDecrementProps = Omit<PrimitiveProps<'button'>, 'aria-label' | 'aria-labelledby'> &
  NumberFieldStepperName

export const NumberFieldDecrement = React.forwardRef<HTMLButtonElement, NumberFieldDecrementProps>(
  function NumberFieldDecrement(
    {
      children,
      className,
      style,
      onClick,
      onPointerDown,
      onPointerUp,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      onPointerCancel,
      onLostPointerCapture,
      type: _managedType,
      tabIndex: _managedTabIndex,
      'data-pressed': _managedPressed,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      disabled: authoredDisabled,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)

    // Capability follows root state or authored disabled (NF-STEP-11);
    // structural type/tabIndex stay managed (NF-TYPE-03); the accessible
    // name is required, validated, and passed through explicitly.
    const isDisabled = context?.disabled || authoredDisabled || false
    const value = context?.value ?? null
    const min = context?.min

    // Required-name gate (PATCHES §6): hooks run unconditionally so
    // named↔unnamed transitions never change the hook count; the null
    // return below is the "neither registers nor activates" branch.
    const named = useStepperName('Decrement', ariaLabel, ariaLabelledby)

    // Press-and-hold stepping (PATCHES §7): consumer handlers chain first
    // inside the hook, so authored pointer props can never clobber the
    // session machine via the trailing spread.
    const repeat = useStepperRepeat({
      action: context ? context.decrement : undefined,
      focusInput: context?.focusInput,
      disabled: isDisabled,
      atBound: value !== null && min !== undefined && value <= min,
      user: {
        onClick,
        onPointerDown,
        onPointerUp,
        onPointerMove,
        onPointerEnter,
        onPointerLeave,
        onPointerCancel,
        onLostPointerCapture,
      },
    })

    if (!named) return null

    return (
      <Button
        ref={ref}
        type="button"
        tabIndex={-1}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        disabled={isDisabled}
        data-pressed={repeat.pressed ? '' : undefined}
        onClick={repeat.handleClick}
        onPointerUp={repeat.handlePointerUp}
        onPointerDown={repeat.handlePointerDown}
        onPointerMove={repeat.handlePointerMove}
        onPointerEnter={repeat.handlePointerEnter}
        onPointerLeave={repeat.handlePointerLeave}
        onPointerCancel={repeat.handlePointerCancel}
        onLostPointerCapture={repeat.handleLostPointerCapture}
        height="100%"
        aspectRatio="1 / 1"
        p="0"
        m="0"
        border="none"
        bg="transparent"
        borderRadius="sm"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        color="design.text.base"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        outline="none"
        _hover={!isDisabled ? { bg: 'ui.button.mutedBackground', color: 'design.text.base' } : undefined}
        _active={!isDisabled ? { bg: 'ui.table.row.mutedBackground' } : undefined}
        _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '1px' }}
        className={className}
        style={{
          aspectRatio: '1 / 1',
          height: '100%',
          margin: 0,
          ...style,
        }}
        {...props}
      >
        {children ?? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </Button>
    )
  }
)

export const NumberField = React.forwardRef<HTMLDivElement, NumberFieldProps>(
  function NumberField(
    {
      children,
      value,
      onChange,
      locale,
      min = -Infinity,
      max = Infinity,
      step: stepProp,
      disabled = false,
      formatOptions,
      commitBehavior = 'none',
      onInvalidCommit,
      className,
      style,
      ...props
    },
    ref
  ) {
    // Runtime validation of numeric props (NF-MATH-02, adapted): fail fast
    // on NaN/unusable props instead of poisoning state. Unlike quarantine,
    // ±Infinity bounds stay legal — they are this engine's unbounded
    // sentinels (the defaults). Render-phase pure checks: StrictMode-safe.
    // FEATURES #1: value is required-controlled (null is the empty value)
    // and locale is required with no environment default; there is no
    // defaultValue and no uncontrolled mode.
    if (value === undefined) {
      throw new Error(
        'Reference UI: NumberField "value" is required — the field is fully controlled, with null as the empty value.'
      )
    }
    if (value !== null && !Number.isFinite(value)) {
      throw new Error('Reference UI: NumberField "value" must be a finite number or null.')
    }
    if (locale == null) {
      throw new Error('Reference UI: NumberField "locale" is required — pass an explicit locale (no environment default).')
    }
    if (Number.isNaN(min)) {
      throw new Error('Reference UI: NumberField "min" must be a number.')
    }
    if (Number.isNaN(max)) {
      throw new Error('Reference UI: NumberField "max" must be a number.')
    }
    if (min > max) {
      throw new Error('Reference UI: NumberField "min" must be less than or equal to "max".')
    }
    if (commitBehavior !== 'snap' && commitBehavior !== 'validate' && commitBehavior !== 'none') {
      throw new Error('Reference UI: NumberField "commitBehavior" must be "snap", "validate", or "none".')
    }

    // W-25: the display formatter. Construction fails fast on a bad locale
    // or option pair (Intl RangeError/TypeError) with the props named.
    const formatter = React.useMemo(() => {
      try {
        return new Intl.NumberFormat(locale, formatOptions)
      } catch (error) {
        throw new Error(
          `Reference UI: NumberField "locale"/"formatOptions" are not a valid Intl.NumberFormat pair — ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }, [locale, formatOptions])
    const percentStyle = React.useMemo(
      () => formatter.resolvedOptions().style === 'percent',
      [formatter]
    )
    // Parse symbols come from a default-grouping formatter so a grouped
    // paste still parses under useGrouping:false (NF-PARSE-07 direction).
    const symbols = React.useMemo(() => draftNumberSymbols(locale), [locale])

    // W-25: percent fields step hundredths by default (React Aria parity);
    // every other style keeps the historic step 1.
    const step = stepProp ?? (percentStyle ? 0.01 : 1)
    if (!Number.isFinite(step) || step <= 0) {
      throw new Error('Reference UI: NumberField "step" must be a finite number greater than 0.')
    }

    // W-02: the ±Infinity sentinels read as absent bounds to the lattice.
    const latticeMin = min === -Infinity ? undefined : min
    const latticeMax = max === Infinity ? undefined : max

    const inputRef = React.useRef<HTMLInputElement | null>(null)

    // B-19: the dirty edit session. Typing writes the draft only; the
    // controlled value is published at commit boundaries (blur, Enter, or a
    // handled step action) — never mid-keystroke, so bounded decimals like
    // "2.5" survive the "." keystroke instead of clamping to the max.
    const [draft, setDraft] = React.useState<string | null>(null)

    // W-25: clean-state text is the Intl formatting of the controlled
    // value; null is the only clean empty display (NF-FORMAT-02). A
    // programmatic -0 renders "0" (String parity — Intl would print "-0",
    // NF-MATH-14); interaction-produced -0 never reaches here.
    const displayValue = React.useMemo(() => {
      if (value === null) return ''
      return formatter.format(Object.is(value, -0) ? 0 : value)
    }, [formatter, value])

    // Any controlled-value change ends the session: commit echoes land on an
    // already-clean draft (no-op), while unrelated programmatic changes
    // replace the buffer with formatted controlled state.
    React.useEffect(() => {
      setDraft(null)
    }, [value])

    // W-25: an effective locale/format change replaces a dirty draft from
    // controlled state (React Aria parity); a referentially new but
    // effectively equal formatOptions object preserves the session.
    const prevFormatRef = React.useRef({ locale, formatOptions })
    React.useEffect(() => {
      const prev = prevFormatRef.current
      if (prev.locale !== locale || !isEqualFormatOptions(prev.formatOptions, formatOptions)) {
        prevFormatRef.current = { locale, formatOptions }
        setDraft(null)
      }
    }, [locale, formatOptions])

    const focusInput = React.useCallback(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const len = inputRef.current.value.length
        try {
          inputRef.current.setSelectionRange(len, len)
        } catch {
          // ignore if not supported
        }
      }
    }, [])

    // A complete dirty candidate (parseable, clamped once) is the step base;
    // empty or incomplete drafts fall back to controlled value, never NaN.
    // The locale parser (W-25) lets formatted drafts ("1,000", "12" under a
    // percent style) step from their numeric meaning.
    const stepBase = React.useMemo(() => {
      if (draft === null || draft.trim() === '') return null
      const num = parseDraftNumber(draft, symbols, percentStyle)
      if (Number.isNaN(num)) return null
      return Math.max(min, Math.min(max, num))
    }, [draft, symbols, percentStyle, min, max])

    // React Aria commit parity: authored display precision applies to the
    // committed number (format, then re-parse). Styles whose text cannot
    // round-trip through the modest parser (compact, units) keep the
    // pre-rounding candidate instead of failing the commit.
    const displayRoundTrip = React.useCallback(
      (candidate: number): number => {
        const reparsed = parseDraftNumber(formatter.format(candidate), symbols, percentStyle)
        return Number.isNaN(reparsed) ? candidate : reparsed
      },
      [formatter, symbols, percentStyle]
    )

    const increment = React.useCallback(
      (factor = 1) => {
        if (disabled) return
        const current = stepBase ?? value ?? 0
        const nextVal = Math.min(max, cleanFloat(current + step * factor))
        // Step actions are commit boundaries: the session ends even when
        // the step itself is suppressed (FEATURES #2: no change → no event).
        setDraft(null)
        if (nextVal === value) return
        onChange?.(nextVal)
      },
      [value, max, step, stepBase, disabled, onChange]
    )

    const decrement = React.useCallback(
      (factor = 1) => {
        if (disabled) return
        const current = stepBase ?? value ?? 0
        const nextVal = Math.max(min, cleanFloat(current - step * factor))
        // Step actions are commit boundaries: the session ends even when
        // the step itself is suppressed (FEATURES #2: no change → no event).
        setDraft(null)
        if (nextVal === value) return
        onChange?.(nextVal)
      },
      [value, min, step, stepBase, disabled, onChange]
    )

    const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // Typing never publishes: the draft holds partial input ("2.", "-",
      // "") verbatim until a commit boundary.
      setDraft(e.target.value)
    }, [])

    const commitDraft = React.useCallback(() => {
      if (draft === null) return
      const text = draft
      // The session ends optimistically: accepted commits echo through the
      // controlled prop, rejected ones snap back to controlled state, and
      // invalid text reverts — all without a numeric request for no-change.
      setDraft(null)
      if (text.trim() === '') {
        // FEATURES #2: clearing an already-empty field is no change.
        if (value === null) return
        onChange?.(null)
        return
      }
      const parsed = parseDraftNumber(text, symbols, percentStyle)
      if (Number.isNaN(parsed)) return
      // W-02 validate: reject off-step and out-of-range commits — revert to
      // controlled state, report the attempt, emit no onChange. Range wins
      // when both apply.
      if (commitBehavior === 'validate') {
        if (parsed < min || parsed > max) {
          onInvalidCommit?.(parsed, 'out-of-range')
          return
        }
        if (!isOnStepLattice(parsed, latticeMin, latticeMax, step)) {
          onInvalidCommit?.(parsed, 'off-step')
          return
        }
        const accepted = displayRoundTrip(parsed)
        const canonical = Object.is(accepted, -0) ? 0 : accepted
        // FEATURES #2: committing the current value is no change.
        if (canonical === value) return
        onChange?.(canonical)
        return
      }
      // W-02 snap: coerce to the lattice within bounds, then apply display
      // precision — one request, never an invalid-commit report.
      if (commitBehavior === 'snap') {
        const snapped = snapValueToLattice(parsed, latticeMin, latticeMax, step)
        const accepted = displayRoundTrip(snapped)
        const canonical = Object.is(accepted, -0) ? 0 : accepted
        // FEATURES #2: committing the current value is no change.
        if (canonical === value) return
        onChange?.(canonical)
        return
      }
      const clamped = Math.max(min, Math.min(max, parsed))
      // FEATURES #2: committing the current value is no change.
      if (clamped === value) return
      onChange?.(clamped)
    }, [
      draft,
      value,
      min,
      max,
      latticeMin,
      latticeMax,
      step,
      symbols,
      percentStyle,
      commitBehavior,
      displayRoundTrip,
      onChange,
      onInvalidCommit,
    ])

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return
        const factor = e.shiftKey ? 10 : 1

        if (e.key === 'ArrowUp') {
          // Alt/Ctrl/Meta-modified arrows stay native (NF-KEY-03).
          if (e.altKey || e.ctrlKey || e.metaKey) return
          e.preventDefault()
          increment(factor)
        } else if (e.key === 'ArrowDown') {
          if (e.altKey || e.ctrlKey || e.metaKey) return
          e.preventDefault()
          decrement(factor)
        } else if (e.key === 'Home') {
          // Home/End target supplied bounds only when unmodified (NF-KEY-04).
          if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return
          if (min === -Infinity) return
          e.preventDefault()
          setDraft(null)
          // FEATURES #2: already at the bound is no change — the key
          // stays handled (caret pinned) but emits nothing.
          if (value === min) return
          onChange?.(min)
        } else if (e.key === 'End') {
          if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey) return
          if (max === Infinity) return
          e.preventDefault()
          setDraft(null)
          // FEATURES #2: already at the bound is no change — the key
          // stays handled (caret pinned) but emits nothing.
          if (value === max) return
          onChange?.(max)
        } else if (e.key === 'Enter') {
          // Enter commits the draft in place (no blur): invalid text
          // reverts, valid text publishes once. A clean field is untouched
          // and the key stays native for form submission.
          if (draft !== null && !e.altKey && !e.ctrlKey && !e.metaKey) {
            commitDraft()
          }
        }
      },
      [disabled, draft, increment, decrement, commitDraft, value, min, max, onChange]
    )

    const contextValue = React.useMemo<NumberFieldContextValue>(
      () => ({
        value,
        displayValue,
        min,
        max,
        step,
        disabled,
        draft,
        increment,
        decrement,
        handleInputChange,
        handleKeyDown,
        commitDraft,
        inputRef,
        focusInput,
      }),
      [
        value,
        displayValue,
        min,
        max,
        step,
        disabled,
        draft,
        increment,
        decrement,
        handleInputChange,
        handleKeyDown,
        commitDraft,
        focusInput,
      ]
    )

    return (
      <NumberFieldContext.Provider value={contextValue}>
        {/* Consumer props spread first: managed role/data authority
            defeats conflicting casts (NF-DOM-06); unrelated props and
            StyleProps pass through (NF-DOM-05). */}
        <Div
          ref={ref}
          {...props}
          role="group"
          data-reference-field=""
          data-reference-number-field=""
          data-disabled={disabled ? '' : undefined}
          className={className}
          style={style}
        >
          {children ?? (
            <>
              {/* Default-authored English names satisfy the PATCHES §6
                  required-name boundary; consumer-authored steppers must
                  carry their own aria-label | aria-labelledby. */}
              <NumberFieldDecrement aria-label="Decrement" />
              <NumberFieldInput />
              <NumberFieldIncrement aria-label="Increment" />
            </>
          )}
        </Div>
      </NumberFieldContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<NumberFieldProps & React.RefAttributes<HTMLDivElement>> & {
  Input: typeof NumberFieldInput
  Increment: typeof NumberFieldIncrement
  Decrement: typeof NumberFieldDecrement
}

NumberField.Input = NumberFieldInput
NumberField.Increment = NumberFieldIncrement
NumberField.Decrement = NumberFieldDecrement

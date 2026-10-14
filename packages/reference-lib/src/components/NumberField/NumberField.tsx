/**
 * NumberField root: a fully controlled locale-aware number field that
 * composes the formatting, session, action, handler, guard, identity,
 * and form hooks, then publishes them as context for Group, Input, and
 * the steppers. It owns the input refs, the invalid union, the shared
 * focus helper, the default anatomy, and the hidden canonical form
 * input — every other behavior lives in its hook. Default children
 * render a complete Group with component-authored stepper names.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { setupFocusVisible } from '../../core/theme/primitives/forms/focus-visible'
import { NumberFieldContext, type NumberFieldContextValue } from './context'
import type { NumberFieldProps } from './types'
import { isOnStepLattice, snapValueToLattice } from './step/lattice'
import { numberFieldDevDiagnostic } from './shared/dev'
import { useFieldFormatting } from './hooks/use-field-formatting'
import { useEditSession } from './hooks/use-edit-session'
import { useStepActions } from './hooks/use-step-actions'
import { useEditHandlers } from './hooks/use-edit-handlers'
import { useInsertGuard } from './hooks/use-insert-guard'
import { useFieldIdentity } from './hooks/use-field-identity'
import { useFormWiring } from './hooks/use-form-wiring'
import { NumberFieldGroup } from './parts/Group'
import { NumberFieldInput } from './parts/Input'
import { NumberFieldIncrement } from './parts/Increment'
import { NumberFieldDecrement } from './parts/Decrement'

setupFocusVisible()

export type {
  NumberFieldCommitBehavior,
  NumberFieldDecrementProps,
  NumberFieldGroupProps,
  NumberFieldIncrementProps,
  NumberFieldInputProps,
  NumberFieldInvalidCommitReason,
  NumberFieldManagedInputProp,
  NumberFieldManagedStepperProp,
  NumberFieldProps,
  NumberFieldStepperName,
} from './types'
export { NumberFieldGroup, NumberFieldInput, NumberFieldIncrement, NumberFieldDecrement }

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
      readOnly = false,
      required = false,
      invalid: appInvalid = false,
      name,
      form,
      formatOptions,
      commitBehavior = 'none',
      onInvalidCommit,
      className,
      style,
      ...props
    },
    ref
  ) {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const hiddenRef = React.useRef<HTMLInputElement | null>(null)

    const formatting = useFieldFormatting({
      value,
      locale,
      min,
      max,
      stepProp,
      formatOptions,
      commitBehavior,
    })
    const {
      percentStyle,
      symbols,
      step,
      latticeMin,
      latticeMax,
      displayValue,
      displayRoundTrip,
      managedInputMode,
      groupingDisabled,
    } = formatting

    // Requests this field makes through onChange (live typing, commits,
    // steps, Home/End) are marked here. Typing publishes raw candidates such
    // as 150 toward max 100, and a consumer echoing one back is not a
    // consumer mistake, so the range check below skips a controlled value
    // equal to its mark. The check consumes the mark on the next change.
    const lastEmittedRef = React.useRef<number | null | undefined>(undefined)
    const emitChange = React.useCallback(
      (next: number | null) => {
        lastEmittedRef.current = next
        onChange?.(next)
      },
      [onChange]
    )

    const session = useEditSession({
      value,
      displayValue,
      locale,
      formatOptions,
      min,
      max,
      step,
      commitBehavior,
      disabled,
      readOnly,
      symbols,
      inputRef,
      onChange: emitChange,
    })
    const { draft, failedBoundary, resetEpoch, replacementEpoch } = session

    const actions = useStepActions({
      session,
      value,
      min,
      max,
      step,
      symbols,
      percentStyle,
      disabled,
      readOnly,
    })
    const { stepBase, increment, decrement } = actions

    const handlers = useEditHandlers({
      session,
      value,
      min,
      max,
      step,
      latticeMin,
      latticeMax,
      symbols,
      percentStyle,
      commitBehavior,
      displayValue,
      displayRoundTrip,
      disabled,
      readOnly,
      onInvalidCommit,
      increment,
      decrement,
    })
    const {
      handleInputChange,
      handleCompositionStart,
      handleCompositionEnd,
      runCommitRef,
      commitDraft,
      handleKeyDown,
    } = handlers

    useInsertGuard({
      inputRef,
      composingRef: session.composingRef,
      disabled,
      readOnly,
      symbols,
      percentStyle,
      groupingDisabled,
    })

    // Owned numeric-constraint state (NF-MATH-15, NF-COMMIT-06, NF-FORM-05):
    // bound and step validity of the controlled value in snap/validate
    // modes. 'none' clamps at commit and owns no invalid state. Native
    // text-input range/step
    // flags always stay false; this state surfaces only through managed
    // aria-invalid/data-invalid, stepper capability, and submit blocking —
    // never setCustomValidity.
    const ownedInvalid = React.useMemo(() => {
      if (value === null || commitBehavior === 'none') return false
      if (latticeMin !== undefined && value < latticeMin) return true
      if (latticeMax !== undefined && value > latticeMax) return true
      if (commitBehavior === 'validate') {
        return !isOnStepLattice(value, step)
      }
      // Snap: an exact supplied endpoint is step-valid by endpoint
      // exception even off lattice; the explicitly rounded image of a
      // lattice point is valid too, so the required post-snap rounding
      // order cannot make a successful snap commit immediately invalid.
      if (value === latticeMin || value === latticeMax) return false
      if (isOnStepLattice(value, step)) return false
      return displayRoundTrip(snapValueToLattice(value, latticeMin, latticeMax, step)) !== value
    }, [value, commitBehavior, latticeMin, latticeMax, step, displayRoundTrip])

    // Dev-only range diagnostic for a controlled value outside [min, max].
    // Nothing clamps here: the value renders and reports as given, and the
    // next commit snaps or clamps it. Absent bounds print as -Infinity and
    // Infinity. Warns once per distinct message; a StrictMode mount re-run
    // repeats the same message and is dropped.
    const lastWarnedRef = React.useRef<string | null>(null)
    React.useEffect(() => {
      const requested = lastEmittedRef.current
      lastEmittedRef.current = undefined
      const lower = min ?? -Infinity
      const upper = max ?? Infinity
      const outside =
        value !== null && Number.isFinite(value) && (value < lower || value > upper)
      if (!outside || value === requested) {
        lastWarnedRef.current = null
        return
      }
      const message = `value (${value}) is outside [${String(lower)}, ${String(upper)}]; it renders as given and snaps into range on the next commit.`
      if (lastWarnedRef.current === message) return
      lastWarnedRef.current = message
      numberFieldDevDiagnostic(message)
    }, [value, min, max])

    // Managed invalid union: application invalid, owned numeric-constraint
    // state, or a retained failed boundary. Application false cannot hide
    // owned failure; application true alone never blocks submit.
    const managedInvalid = appInvalid || ownedInvalid || failedBoundary

    // Canonical hidden form value (NF-FORM-01): "" for null, String(value)
    // otherwise. Interaction -0 never reaches here (canonicalized at the
    // request site); a programmatic -0 renders "0" via String parity.
    const canonicalHiddenValue = value === null ? '' : String(value)

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

    // Default composition (children omitted): a complete Group with
    // component-authored English stepper names. Consumer-authored steppers
    // must carry their own aria-label | aria-labelledby (PATCHES §6).
    const effectiveChildren =
      children ?? (
        <NumberFieldGroup>
          <NumberFieldDecrement aria-label="Decrement" />
          <NumberFieldInput />
          <NumberFieldIncrement aria-label="Increment" />
        </NumberFieldGroup>
      )

    const { inputId } = useFieldIdentity({
      effectiveChildren,
      groupPart: NumberFieldGroup,
      inputPart: NumberFieldInput,
      session,
      inputRef,
      displayValue,
      draft,
    })

    useFormWiring({
      session,
      runCommitRef,
      name,
      form,
      inputRef,
      hiddenRef,
      readOnly,
      ownedInvalid,
      displayValue,
      canonicalHiddenValue,
    })

    const contextValue = React.useMemo<NumberFieldContextValue>(
      () => ({
        value,
        displayValue,
        min,
        max,
        step,
        disabled,
        readOnly,
        required,
        invalid: managedInvalid,
        inputMode: managedInputMode,
        inputId,
        draft,
        stepBase,
        resetEpoch,
        replacementEpoch,
        increment,
        decrement,
        handleInputChange,
        handleCompositionStart,
        handleCompositionEnd,
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
        readOnly,
        required,
        managedInvalid,
        managedInputMode,
        inputId,
        draft,
        stepBase,
        resetEpoch,
        replacementEpoch,
        increment,
        decrement,
        handleInputChange,
        handleCompositionStart,
        handleCompositionEnd,
        handleKeyDown,
        commitDraft,
        focusInput,
      ]
    )

    const empty = draft !== null ? draft === '' : value === null

    // NF-EDIT-07 pre-commit capture: while the DOM still holds the outgoing
    // text, remember it with the live selection. A pure read (no writes),
    // refreshed on every focused render, so the replacing render always
    // carries the true pre-replacement caret — including programmatic
    // setSelectionRange placements, which fire no event to observe.
    {
      const node = inputRef.current
      if (node) {
        try {
          const root = node.getRootNode() as Document | ShadowRoot
          if (root.activeElement === node) {
            session.caretCaptureRef.current = {
              text: node.value,
              start: node.selectionStart ?? node.value.length,
              end: node.selectionEnd ?? node.value.length,
            }
          }
        } catch {
          // ignore if not supported
        }
      }
    }

    return (
      <NumberFieldContext.Provider value={contextValue}>
        {/* Consumer props spread first: managed data authority defeats
            forged casts (NF-DOM-06); unrelated props and StyleProps pass
            through (NF-DOM-05). The root is a plain host — Group owns the
            role, bezel markers, and focus-visible integration. */}
        <Div
          ref={ref}
          {...props}
          data-disabled={disabled ? '' : undefined}
          data-readonly={readOnly ? '' : undefined}
          data-required={required ? '' : undefined}
          data-invalid={managedInvalid ? '' : undefined}
          data-empty={empty ? '' : undefined}
          data-editing={draft !== null ? '' : undefined}
          className={className}
          style={style}
        >
          {effectiveChildren}
          {/* Hidden canonical form input (NF-DOM-02, NF-FORM-01): exactly
              one root-direct input[type=hidden] when name is set. It has no
              public part or ref, carries canonical String(value), mirrors
              disabled, and never validates (no number proxy). readOnly
              silences the controlled-input warning; it changes nothing
              about submission. */}
          {name ? (
            <input
              ref={hiddenRef}
              type="hidden"
              name={name}
              form={form}
              value={canonicalHiddenValue}
              disabled={disabled}
              readOnly
            />
          ) : null}
        </Div>
      </NumberFieldContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<NumberFieldProps & React.RefAttributes<HTMLDivElement>> & {
  Group: typeof NumberFieldGroup
  Input: typeof NumberFieldInput
  Increment: typeof NumberFieldIncrement
  Decrement: typeof NumberFieldDecrement
}

NumberField.Group = NumberFieldGroup
NumberField.Input = NumberFieldInput
NumberField.Increment = NumberFieldIncrement
NumberField.Decrement = NumberFieldDecrement

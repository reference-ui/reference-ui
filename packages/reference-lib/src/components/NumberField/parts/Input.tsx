/**
 * NumberField.Input: the single text tab stop. It renders the verbatim
 * draft while dirty and the clean formatted value otherwise, chains
 * consumer edit handlers first with cancellation suppressing managed
 * work, commits on blur (vetoable, preserving the dirty selection while
 * unfocused), and diagnoses a missing accessible name without inventing
 * label markup. Managed authority strips every behavior-owned prop so
 * conflicting casts cannot land.
 */
import * as React from 'react'
import { Input } from '@reference-ui/react'
import { NumberFieldContext, NumberFieldGroupContext } from '../context'
import type { NumberFieldInputProps } from '../types'
import { numberFieldDevDiagnostic } from '../shared/dev'
import { useIsomorphicLayoutEffect } from '../shared/dom'
import { stepperNameIds, stepperNameText } from '../shared/names'

export const NumberFieldInput = React.forwardRef<HTMLInputElement, NumberFieldInputProps>(
  function NumberFieldInput(
    {
      className,
      style,
      onKeyDown: userOnKeyDown,
      onChange: userOnChange,
      onCompositionStart: userOnCompositionStart,
      onCompositionEnd: userOnCompositionEnd,
      onFocus: userOnFocus,
      onBlur: userOnBlur,
      autoComplete: authoredAutoComplete,
      autoCorrect: authoredAutoCorrect,
      spellCheck: authoredSpellCheck,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) {
      throw new Error(
        'Reference UI: NumberField.Input must be used inside <NumberField> — it has no behavior outside the field.'
      )
    }
    const groupScope = React.useContext(NumberFieldGroupContext)
    if (!groupScope) {
      throw new Error(
        'Reference UI: NumberField.Input must be a direct child of <NumberField.Group> — misplaced parts never join behavior.'
      )
    }

    const {
      value,
      displayValue,
      disabled,
      readOnly,
      required,
      invalid,
      inputMode,
      inputId,
      draft,
      handleInputChange,
      handleCompositionStart,
      handleCompositionEnd,
      handleKeyDown,
      commitDraft,
      inputRef,
    } = context
    const empty = draft !== null ? draft === '' : value === null

    // Named-part registration (NF-DOM-03): the Group counts registrations
    // to catch nested extras. Unnamed Input still renders and registers —
    // only the missing name diagnoses (NF-A11Y-02).
    const registerPart = groupScope.registerPart
    useIsomorphicLayoutEffect(() => registerPart('input'), [registerPart])

    // Unnamed Input diagnoses without inventing label markup (NF-A11Y-02):
    // naming stays the application's job (label, aria-label, labelledby).
    // Targets only exist in committed DOM, so labelledby resolution runs in
    // a layout effect like the stepper gate. Associated <label> elements
    // (htmlFor or wrapping) count as names — only the truly unnamed log.
    const unnamedLoggedRef = React.useRef(false)
    useIsomorphicLayoutEffect(() => {
      const labelValid = stepperNameText(ariaLabel).trim() !== ''
      const labelledbyText = stepperNameText(ariaLabelledby)
      const ids = stepperNameIds(labelledbyText)
      let named = labelValid
      // NF-ENV-06: name resolution stays in the owner root (open
      // ShadowRoot included) — never document-global.
      const root =
        (inputRef.current?.getRootNode() as Document | ShadowRoot | undefined) ??
        (typeof document !== 'undefined' ? document : undefined)
      if (!named && root !== undefined) {
        const node = inputRef.current
        const forLabel = root.querySelector(`label[for="${inputId}"]`)
        if (forLabel && (forLabel.textContent ?? '').trim() !== '') {
          named = true
        } else if (node?.closest('label') && (node.closest('label')?.textContent ?? '').trim() !== '') {
          named = true
        }
      }
      if (!named && ids.length > 0 && root !== undefined) {
        const name = ids
          .map(id => {
            const el = root.getElementById(id)
            return el === null ? '' : el.getAttribute('aria-label') || el.textContent || ''
          })
          .join(' ')
        named = name.trim() !== ''
      }
      if (named) {
        unnamedLoggedRef.current = false
        return
      }
      if (unnamedLoggedRef.current) return
      unnamedLoggedRef.current = true
      numberFieldDevDiagnostic(
        'Input has no accessible name — associate a <label>, aria-label, or aria-labelledby; no label markup was invented.'
      )
    }, [ariaLabel, ariaLabelledby, inputId, inputRef])

    // Managed authority (NF-TYPE-03, NF-DOM-06): behavior-owned props are
    // stripped so conflicting consumer casts cannot break the field.
    // Input keeps plain textbox semantics — no role recast,
    // no numeric aria-value* — so stripping also enforces their absence.
    // Input alone carries native readOnly/required; Group never renders
    // aria-readonly/aria-required. The authored id is consumed by the root
    // scan (explicit-ID priority) and stripped here so an explicit
    // undefined cannot erase the resolved context id downstream.
    // Unrelated props (aria-label, data-* descriptions, placeholder) pass
    // through untouched (NF-DOM-05).
    const {
      id: _explicitId,
      type: _managedType,
      role: _managedRole,
      value: _managedValue,
      defaultValue: _managedDefaultValue,
      inputMode: _managedInputMode,
      name: _managedName,
      form: _managedForm,
      min: _managedMin,
      max: _managedMax,
      step: _managedStep,
      disabled: _managedDisabled,
      readOnly: _managedReadOnly,
      required: _managedRequired,
      'aria-disabled': _managedAriaDisabled,
      'aria-readonly': _managedAriaReadonly,
      'aria-required': _managedAriaRequired,
      'aria-invalid': _managedAriaInvalid,
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

    // NF-EDIT-11: consumer composition observers run first; the managed
    // session flag always tracks the native session (no veto exists).
    const onCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
      userOnCompositionStart?.(e)
      handleCompositionStart()
    }
    const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      userOnCompositionEnd?.(e)
      handleCompositionEnd()
    }

    // A vetoed blur keeps the dirty session and its selection while
    // unfocused (NF-COMMIT-10); refocus restores the exact selection.
    const vetoedSelectionRef = React.useRef<{ start: number; end: number } | null>(null)
    const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      userOnFocus?.(e)
      const vetoed = vetoedSelectionRef.current
      vetoedSelectionRef.current = null
      if (vetoed && draft !== null) {
        try {
          e.currentTarget.setSelectionRange(vetoed.start, vetoed.end)
        } catch {
          // ignore if not supported
        }
      }
    }

    // Blur is a commit boundary: the consumer observes first and can veto
    // the commit with preventDefault, leaving the dirty buffer intact.
    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      userOnBlur?.(e)
      if (e.defaultPrevented) {
        try {
          vetoedSelectionRef.current = {
            start: e.currentTarget.selectionStart ?? e.currentTarget.value.length,
            end: e.currentTarget.selectionEnd ?? e.currentTarget.value.length,
          }
        } catch {
          vetoedSelectionRef.current = null
        }
        return
      }
      vetoedSelectionRef.current = null
      commitDraft()
    }

    return (
      <Input
        ref={setInputRef}
        type="text"
        id={inputId}
        inputMode={inputMode}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid ? 'true' : undefined}
        aria-label={ariaLabel as string | undefined}
        aria-labelledby={ariaLabelledby as string | undefined}
        autoComplete={authoredAutoComplete ?? 'off'}
        autoCorrect={authoredAutoCorrect ?? 'off'}
        spellCheck={authoredSpellCheck ?? false}
        value={draft ?? displayValue}
        data-disabled={disabled ? '' : undefined}
        data-readonly={readOnly ? '' : undefined}
        data-required={required ? '' : undefined}
        data-invalid={invalid ? '' : undefined}
        data-empty={empty ? '' : undefined}
        data-editing={draft !== null ? '' : undefined}
        onChange={onChange}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className={className}
        style={style}
        {...restProps}
      />
    )
  }
)

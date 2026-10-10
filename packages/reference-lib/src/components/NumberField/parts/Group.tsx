/**
 * NumberField.Group: the direct-anatomy owner. It throws unless it is a
 * direct child of the field with exactly one direct Input and at most one
 * of each stepper, counts named-part registrations to catch nested
 * extras, and renders the group role with managed data flags plus the
 * focus tracking of its single Input tab stop. Arbitrary non-part
 * siblings pass through untouched.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import {
  NumberFieldContext,
  NumberFieldGroupContext,
  type NumberFieldGroupScopeValue,
  type NumberFieldPartKind,
} from '../context'
import type { NumberFieldGroupProps } from '../types'
import { isNumberFieldPart } from '../shared/anatomy'
import { useIsomorphicLayoutEffect } from '../shared/dom'
import { NumberFieldDecrement } from './Decrement'
import { NumberFieldIncrement } from './Increment'
import { NumberFieldInput } from './Input'

export const NumberFieldGroup = React.forwardRef<HTMLDivElement, NumberFieldGroupProps>(
  function NumberFieldGroup(
    {
      children,
      status,
      className,
      style,
      onFocus: userOnFocus,
      onBlur: userOnBlur,
      ...props
    },
    ref
  ) {
    const context = React.useContext(NumberFieldContext)
    if (!context) {
      throw new Error(
        'Reference UI: NumberField.Group must be a direct child of <NumberField> — it has no behavior outside the field.'
      )
    }

    // Direct-anatomy validation (NF-DOM-03, render phase so SSR fails fast
    // too): exactly one direct Input, at most one of each stepper. Arbitrary
    // non-part siblings pass through untouched (NF-DOM-04).
    const kids = React.Children.toArray(children)
    const directInputCount = kids.filter(kid => isNumberFieldPart(kid, NumberFieldInput)).length
    if (directInputCount === 0) {
      throw new Error(
        'Reference UI: NumberField.Group requires exactly one direct <NumberField.Input> — none was found; only named parts join behavior.'
      )
    }
    if (directInputCount > 1) {
      throw new Error(
        `Reference UI: NumberField.Group requires exactly one direct <NumberField.Input> but found ${directInputCount} — no DOM-order authority is chosen.`
      )
    }
    const directIncCount = kids.filter(kid => isNumberFieldPart(kid, NumberFieldIncrement)).length
    if (directIncCount > 1) {
      throw new Error(
        `Reference UI: NumberField.Group accepts at most one direct <NumberField.Increment> but found ${directIncCount} — no DOM-order authority is chosen.`
      )
    }
    const directDecCount = kids.filter(kid => isNumberFieldPart(kid, NumberFieldDecrement)).length
    if (directDecCount > 1) {
      throw new Error(
        `Reference UI: NumberField.Group accepts at most one direct <NumberField.Decrement> but found ${directDecCount} — no DOM-order authority is chosen.`
      )
    }

    // Nested-extra registry: parts register in layout effects, which run
    // bottom-up, so this Group check observes the settled counts. Unnamed
    // steppers render nothing and never register; unnamed Input still does.
    const registryRef = React.useRef({ input: 0, increment: 0, decrement: 0 })
    const registerPart = React.useCallback((kind: NumberFieldPartKind) => {
      registryRef.current[kind] += 1
      return () => {
        registryRef.current[kind] -= 1
      }
    }, [])
    const scopeValue = React.useMemo<NumberFieldGroupScopeValue>(
      () => ({ registerPart }),
      [registerPart]
    )
    useIsomorphicLayoutEffect(() => {
      const counts = registryRef.current
      if (counts.input > 1 || counts.increment > 1 || counts.decrement > 1) {
        throw new Error(
          'Reference UI: NumberField.Group found duplicate named parts nested inside non-part siblings — named parts must be direct children of the Group.'
        )
      }
    })

    // data-focused tracks the single Input tab stop (NF-A11Y-05):
    // pointer-focus sets it, blur clears it. data-focus-visible is owned
    // by the shared interaction kernel via the marker (TESTS "Owned
    // elsewhere"); a forged static attribute is stripped once on mount.
    const groupRef = React.useRef<HTMLDivElement | null>(null)
    const [focused, setFocused] = React.useState(false)
    useIsomorphicLayoutEffect(() => {
      groupRef.current?.removeAttribute('data-focus-visible')
    }, [])
    const setGroupRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        groupRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref]
    )
    const inputRef = context.inputRef
    const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
      userOnFocus?.(e)
      if (e.target === inputRef.current) setFocused(true)
    }
    const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      userOnBlur?.(e)
      if (e.target === inputRef.current) setFocused(false)
    }

    const { value, disabled, readOnly, required, invalid, draft } = context
    const empty = draft !== null ? draft === '' : value === null

    // Managed authority (NF-DOM-06): behavior-owned props are stripped so
    // conflicting runtime casts cannot break the field; data-status comes
    // only from status="warning". Unrelated props pass through (NF-DOM-05).
    const {
      role: _managedRole,
      'aria-disabled': _managedAriaDisabled,
      'aria-readonly': _managedAriaReadonly,
      'aria-required': _managedAriaRequired,
      'aria-invalid': _managedAriaInvalid,
      ...restProps
    } = props as Record<string, unknown>

    return (
      <NumberFieldGroupContext.Provider value={scopeValue}>
        <Div
          ref={setGroupRef}
          {...restProps}
          role="group"
          data-reference-field=""
          data-reference-number-field=""
          aria-disabled={disabled ? 'true' : undefined}
          aria-invalid={invalid ? 'true' : undefined}
          data-disabled={disabled ? '' : undefined}
          data-readonly={readOnly ? '' : undefined}
          data-required={required ? '' : undefined}
          data-invalid={invalid ? '' : undefined}
          data-empty={empty ? '' : undefined}
          data-editing={draft !== null ? '' : undefined}
          data-focused={focused ? '' : undefined}
          data-status={status === 'warning' ? 'warning' : undefined}
          onFocus={onFocus}
          onBlur={onBlur}
          className={className}
          style={style}
        >
          {children}
        </Div>
      </NumberFieldGroupContext.Provider>
    )
  }
)

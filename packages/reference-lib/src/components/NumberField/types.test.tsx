import * as React from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  NumberField,
  type NumberFieldCommitBehavior,
  type NumberFieldDecrementProps,
  type NumberFieldGroupProps,
  type NumberFieldIncrementProps,
  type NumberFieldInputProps,
  type NumberFieldInvalidCommitReason,
  type NumberFieldProps,
} from './NumberField'

describe('NumberField type contract', () => {
  it('NF-TYPE-01: NumberField should export the conventional root and no Root alias', () => {
    expect(NumberField).toBeDefined()
    expect(NumberField.Group).toBeDefined()
    expect(NumberField.Input).toBeDefined()
    expect(NumberField.Increment).toBeDefined()
    expect(NumberField.Decrement).toBeDefined()

    // @ts-expect-error - NumberField.Root does not exist
    const _noRoot = NumberField.Root
    expect(_noRoot).toBeUndefined()

    // FEATURES #1: omitted value/locale, defaultValue, and uncontrolled
    // usage all fail — the root is conventional and required-controlled.
    // @ts-expect-error - value is required
    const _noValue: NumberFieldProps = { locale: 'en-US' }
    expect(_noValue).toBeDefined()

    // @ts-expect-error - locale is required
    const _noLocale: NumberFieldProps = { value: null }
    expect(_noLocale).toBeDefined()

    // @ts-expect-error - defaultValue does not exist
    const _noDefault: NumberFieldProps = { value: null, locale: 'en-US', defaultValue: 5 }
    expect(_noDefault).toBeDefined()
  })

  it('NF-TYPE-02: NumberField should type one controlled numeric request authority without claiming compile-time finiteness', () => {
    // FEATURES #1: required controlled value + required locale, no
    // defaultValue, no uncontrolled mode — the TESTS.md freeze catalog.
    const validProps: NumberFieldProps = {
      value: 123.45,
      onChange: (value: number | null) => void value,
      min: 0,
      max: 100,
      step: 1,
      disabled: false,
      readOnly: false,
      required: true,
      invalid: false,
      name: 'quantity',
      form: 'order-form',
      locale: 'en-US',
      width: '40r',
    }
    expect(validProps.value).toBe(123.45)
    expect(typeof validProps.onChange).toBe('function')

    const validGroupProps: NumberFieldGroupProps = {
      status: 'warning',
      width: '40r',
    }
    expect(validGroupProps.status).toBe('warning')

    const validInputProps: NumberFieldInputProps = {
      'aria-label': 'Quantity',
    }
    expect(validInputProps['aria-label']).toBe('Quantity')

    const validIncProps: NumberFieldIncrementProps = { 'aria-label': 'Increase' }
    const validDecProps: NumberFieldDecrementProps = { 'aria-label': 'Decrease' }
    expect(validIncProps['aria-label']).toBe('Increase')
    expect(validDecProps['aria-label']).toBe('Decrease')

    const element = (
      <NumberField {...validProps}>
        <NumberField.Group {...validGroupProps}>
          <NumberField.Decrement {...validDecProps} />
          <NumberField.Input {...validInputProps} />
          <NumberField.Increment {...validIncProps} />
        </NumberField.Group>
      </NumberField>
    )
    expect(React.isValidElement(element)).toBe(true)

    expectTypeOf<NumberFieldProps['value']>().toEqualTypeOf<number | null>()
    expectTypeOf<NumberFieldProps['onChange']>().toEqualTypeOf<((value: number | null) => void) | undefined>()
    expectTypeOf<NumberFieldProps['min']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['max']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['step']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['disabled']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<NumberFieldProps['readOnly']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<NumberFieldProps['required']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<NumberFieldProps['invalid']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<NumberFieldProps['name']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<NumberFieldProps['form']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<NumberFieldProps['locale']>().toEqualTypeOf<string>()

    // @ts-expect-error - string value rejected
    const _strVal: NumberFieldProps = { value: '123', locale: 'en-US' }
    expect(_strVal).toBeDefined()

    // @ts-expect-error - raw text callback rejected
    const _rawCb: NumberFieldProps = { value: null, locale: 'en-US', onTextChange: (s: string) => void s }
    expect(_rawCb).toBeDefined()

    // @ts-expect-error - allowWheel does not exist (wheel never steps)
    const _noWheel: NumberFieldProps = { value: null, locale: 'en-US', allowWheel: true }
    expect(_noWheel).toBeDefined()

    // @ts-expect-error - smallStep does not exist (one lattice)
    const _noSmall: NumberFieldProps = { value: null, locale: 'en-US', smallStep: 0.1 }
    expect(_noSmall).toBeDefined()

    // @ts-expect-error - largeStep does not exist (fixed 10 * step Shift)
    const _noLarge: NumberFieldProps = { value: null, locale: 'en-US', largeStep: 10 }
    expect(_noLarge).toBeDefined()

    // @ts-expect-error - as does not exist (fixed hosts, no polymorphism)
    const _noAs: NumberFieldProps = { value: null, locale: 'en-US', as: 'section' }
    expect(_noAs).toBeDefined()
  })

  it('NF-TYPE-03: NumberField parts should omit every behavior-owned native and ARIA prop', () => {
    // Group: native props, StyleProps, css, and matching refs compile;
    // behavior-owned role/state ARIA do not. Group read-only/required
    // styling stays data-only (no aria-readonly/aria-required anywhere).
    const groupRef = React.createRef<HTMLDivElement>()
    const groupElement = (
      <NumberField.Group
        ref={groupRef}
        id="group"
        title="group title"
        aria-label="Quantity group"
        aria-describedby="desc"
        width="40r"
        css={{ padding: '4px' }}
        status="warning"
      />
    )
    expect(React.isValidElement(groupElement)).toBe(true)

    // @ts-expect-error - Group role is managed
    const _groupRole: NumberFieldGroupProps = { role: 'form' }
    expect(_groupRole).toBeDefined()

    // @ts-expect-error - Group aria-disabled is managed
    const _groupDisabled: NumberFieldGroupProps = { 'aria-disabled': true }
    expect(_groupDisabled).toBeDefined()

    // @ts-expect-error - Group aria-readonly never exists
    const _groupReadonly: NumberFieldGroupProps = { 'aria-readonly': true }
    expect(_groupReadonly).toBeDefined()

    // @ts-expect-error - Group aria-required never exists
    const _groupRequired: NumberFieldGroupProps = { 'aria-required': true }
    expect(_groupRequired).toBeDefined()

    // @ts-expect-error - Group aria-invalid is managed
    const _groupInvalid: NumberFieldGroupProps = { 'aria-invalid': true }
    expect(_groupInvalid).toBeDefined()

    // @ts-expect-error - Group status="error" does not exist
    const _groupError: NumberFieldGroupProps = { status: 'error' }
    expect(_groupError).toBeDefined()

    // Input: every documented managed prop is rejected while unrelated
    // naming/description/event props remain available.
    const inputRef = React.createRef<HTMLInputElement>()
    const inputElement = (
      <NumberField.Input
        ref={inputRef}
        id="input"
        aria-label="Quantity"
        aria-labelledby="label"
        aria-describedby="desc"
        aria-errormessage="err"
        placeholder="0.00"
        enterKeyHint="done"
        autoComplete="off"
        spellCheck={false}
        width="40r"
        css={{ padding: '4px' }}
        onFocus={() => {}}
        onBlur={() => {}}
        onKeyDown={() => {}}
      />
    )
    expect(React.isValidElement(inputElement)).toBe(true)

    // @ts-expect-error - Input type is managed
    const _inputType: NumberFieldInputProps = { type: 'number' }
    expect(_inputType).toBeDefined()

    // @ts-expect-error - Input role is managed (plain textbox)
    const _inputRole: NumberFieldInputProps = { role: 'spinbutton' }
    expect(_inputRole).toBeDefined()

    // @ts-expect-error - Input value is managed
    const _inputValue: NumberFieldInputProps = { value: '1' }
    expect(_inputValue).toBeDefined()

    // @ts-expect-error - Input defaultValue is managed
    const _inputDefault: NumberFieldInputProps = { defaultValue: '1' }
    expect(_inputDefault).toBeDefined()

    // @ts-expect-error - Input inputMode is managed
    const _inputMode: NumberFieldInputProps = { inputMode: 'numeric' }
    expect(_inputMode).toBeDefined()

    // @ts-expect-error - Input name is managed (hidden input owns it)
    const _inputName: NumberFieldInputProps = { name: 'x' }
    expect(_inputName).toBeDefined()

    // @ts-expect-error - Input form is managed
    const _inputForm: NumberFieldInputProps = { form: 'f' }
    expect(_inputForm).toBeDefined()

    // @ts-expect-error - Input min is managed
    const _inputMin: NumberFieldInputProps = { min: 0 }
    expect(_inputMin).toBeDefined()

    // @ts-expect-error - Input max is managed
    const _inputMax: NumberFieldInputProps = { max: 1 }
    expect(_inputMax).toBeDefined()

    // @ts-expect-error - Input step is managed
    const _inputStep: NumberFieldInputProps = { step: 1 }
    expect(_inputStep).toBeDefined()

    // @ts-expect-error - Input disabled is managed
    const _inputDisabled: NumberFieldInputProps = { disabled: true }
    expect(_inputDisabled).toBeDefined()

    // @ts-expect-error - Input readOnly is managed
    const _inputReadonly: NumberFieldInputProps = { readOnly: true }
    expect(_inputReadonly).toBeDefined()

    // @ts-expect-error - Input required is managed
    const _inputRequired: NumberFieldInputProps = { required: true }
    expect(_inputRequired).toBeDefined()

    // @ts-expect-error - Input aria-disabled is managed
    const _inputAriaDisabled: NumberFieldInputProps = { 'aria-disabled': true }
    expect(_inputAriaDisabled).toBeDefined()

    // @ts-expect-error - Input aria-readonly is managed
    const _inputAriaReadonly: NumberFieldInputProps = { 'aria-readonly': true }
    expect(_inputAriaReadonly).toBeDefined()

    // @ts-expect-error - Input aria-required is managed
    const _inputAriaRequired: NumberFieldInputProps = { 'aria-required': true }
    expect(_inputAriaRequired).toBeDefined()

    // @ts-expect-error - Input aria-invalid is managed
    const _inputAriaInvalid: NumberFieldInputProps = { 'aria-invalid': true }
    expect(_inputAriaInvalid).toBeDefined()

    // @ts-expect-error - Input aria-valuemin never exists (textbox)
    const _inputValueMin: NumberFieldInputProps = { 'aria-valuemin': 0 }
    expect(_inputValueMin).toBeDefined()

    // @ts-expect-error - Input aria-valuemax never exists (textbox)
    const _inputValueMax: NumberFieldInputProps = { 'aria-valuemax': 1 }
    expect(_inputValueMax).toBeDefined()

    // @ts-expect-error - Input aria-valuenow never exists (textbox)
    const _inputValueNow: NumberFieldInputProps = { 'aria-valuenow': 0 }
    expect(_inputValueNow).toBeDefined()

    // @ts-expect-error - Input aria-valuetext never exists (textbox)
    const _inputValueText: NumberFieldInputProps = { 'aria-valuetext': 'x' }
    expect(_inputValueText).toBeDefined()

    // Steppers: every documented managed semantic prop is rejected while
    // the accessible-name union plus native button handlers/children stay.
    const stepperRef = React.createRef<HTMLButtonElement>()
    const stepperElement = (
      <NumberField.Increment
        ref={stepperRef}
        aria-label="Increase"
        id="inc"
        title="inc title"
        width="10r"
        css={{ padding: '4px' }}
        onClick={() => {}}
      >
        +
      </NumberField.Increment>
    )
    expect(React.isValidElement(stepperElement)).toBe(true)

    // @ts-expect-error - stepper type is managed
    const _stepType: NumberFieldIncrementProps = { 'aria-label': 'x', type: 'submit' }
    expect(_stepType).toBeDefined()

    // @ts-expect-error - stepper tabIndex is managed
    const _stepTab: NumberFieldIncrementProps = { 'aria-label': 'x', tabIndex: 0 }
    expect(_stepTab).toBeDefined()

    // @ts-expect-error - stepper role is managed
    const _stepRole: NumberFieldIncrementProps = { 'aria-label': 'x', role: 'switch' }
    expect(_stepRole).toBeDefined()

    // @ts-expect-error - stepper aria-controls is managed
    const _stepControls: NumberFieldIncrementProps = { 'aria-label': 'x', 'aria-controls': 'y' }
    expect(_stepControls).toBeDefined()

    // @ts-expect-error - stepper aria-disabled is managed
    const _stepDisabled: NumberFieldDecrementProps = { 'aria-label': 'x', 'aria-disabled': true }
    expect(_stepDisabled).toBeDefined()

    // @ts-expect-error - stepper aria-readonly never exists
    const _stepReadonly: NumberFieldDecrementProps = { 'aria-label': 'x', 'aria-readonly': true }
    expect(_stepReadonly).toBeDefined()

    // @ts-expect-error - stepper aria-required never exists
    const _stepRequired: NumberFieldDecrementProps = { 'aria-label': 'x', 'aria-required': true }
    expect(_stepRequired).toBeDefined()

    // @ts-expect-error - stepper aria-checked never exists
    const _stepChecked: NumberFieldDecrementProps = { 'aria-label': 'x', 'aria-checked': true }
    expect(_stepChecked).toBeDefined()

    // @ts-expect-error - stepper aria-pressed never exists
    const _stepPressed: NumberFieldDecrementProps = { 'aria-label': 'x', 'aria-pressed': true }
    expect(_stepPressed).toBeDefined()

    // @ts-expect-error - stepper aria-valuemin never exists
    const _stepValueMin: NumberFieldDecrementProps = { 'aria-label': 'x', 'aria-valuemin': 0 }
    expect(_stepValueMin).toBeDefined()

    // @ts-expect-error - stepper aria-valuemax never exists
    const _stepValueMax: NumberFieldIncrementProps = { 'aria-label': 'x', 'aria-valuemax': 1 }
    expect(_stepValueMax).toBeDefined()

    // @ts-expect-error - stepper aria-valuenow never exists
    const _stepValueNow: NumberFieldIncrementProps = { 'aria-label': 'x', 'aria-valuenow': 0 }
    expect(_stepValueNow).toBeDefined()

    // @ts-expect-error - stepper aria-valuetext never exists
    const _stepValueText: NumberFieldIncrementProps = { 'aria-label': 'x', 'aria-valuetext': 'y' }
    expect(_stepValueText).toBeDefined()

    const stringRef = React.createRef<string>()
    // @ts-expect-error - wrong ref type on Group (non-element refs rejected)
    const _wrongGroupRef = <NumberField.Group ref={stringRef} />
    expect(_wrongGroupRef).toBeDefined()

    // @ts-expect-error - wrong ref type on Input
    const _wrongInputRef = <NumberField.Input ref={groupRef} aria-label="x" />
    expect(_wrongInputRef).toBeDefined()

    // @ts-expect-error - wrong ref type on stepper
    const _wrongStepRef = <NumberField.Increment ref={groupRef} aria-label="x" />
    expect(_wrongStepRef).toBeDefined()
  })

  it('NF-TYPE-04: Each stepper should require an authored accessible-name prop at the type boundary', () => {
    // PATCHES §6: nonempty-shaped label, labelledby, and both together
    // compile on both steppers; runtime emptiness is diagnosed separately.
    const labelOnly: NumberFieldIncrementProps = { 'aria-label': 'Increase' }
    const byOnly: NumberFieldIncrementProps = { 'aria-labelledby': 'inc-label' }
    const both: NumberFieldIncrementProps = { 'aria-label': 'Increase', 'aria-labelledby': 'inc-label' }
    const decLabel: NumberFieldDecrementProps = { 'aria-label': 'Decrease' }
    const decBy: NumberFieldDecrementProps = { 'aria-labelledby': 'dec-label' }
    const decBoth: NumberFieldDecrementProps = { 'aria-label': 'Decrease', 'aria-labelledby': 'dec-label' }
    expect([labelOnly, byOnly, both, decLabel, decBy, decBoth].length).toBe(6)

    // Native button handlers/children survive alongside the name requirement.
    const full: NumberFieldIncrementProps = {
      'aria-label': 'Increase',
      onClick: () => {},
      onPointerDown: () => {},
      disabled: true,
      children: '+',
    }
    const named = (
      <NumberField value={null} locale="en-US">
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrease" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increase" onClick={() => {}}>
            +
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField>
    )
    expect(full.disabled).toBe(true)
    expect(React.isValidElement(named)).toBe(true)

    // @ts-expect-error - neither accessible-name prop
    const _neither: NumberFieldIncrementProps = {}
    expect(_neither).toBeDefined()

    // @ts-expect-error - other props do not satisfy the name requirement
    const _neitherDec: NumberFieldDecrementProps = { disabled: true }
    expect(_neitherDec).toBeDefined()

    // @ts-expect-error - JSX without an accessible-name prop fails
    const _unnamed = <NumberField.Increment />
    expect(_unnamed).toBeDefined()
  })

  it('W-02/W-25: NumberField should type commitBehavior, formatOptions, and onInvalidCommit', () => {
    const commitProps: NumberFieldProps = {
      value: 2.5,
      locale: 'en-US',
      commitBehavior: 'snap',
      formatOptions: { style: 'currency', currency: 'USD' },
      onInvalidCommit: (attempted: number, reason: NumberFieldInvalidCommitReason) => {
        void attempted
        void reason
      },
    }
    expect(commitProps.commitBehavior).toBe('snap')

    const validate: NumberFieldCommitBehavior = 'validate'
    const none: NumberFieldCommitBehavior = 'none'
    expect([validate, none].length).toBe(2)

    expectTypeOf<NumberFieldProps['commitBehavior']>().toEqualTypeOf<
      NumberFieldCommitBehavior | undefined
    >()
    expectTypeOf<NumberFieldProps['formatOptions']>().toEqualTypeOf<
      Intl.NumberFormatOptions | undefined
    >()
    expectTypeOf<NumberFieldProps['onInvalidCommit']>().toEqualTypeOf<
      ((attempted: number, reason: NumberFieldInvalidCommitReason) => void) | undefined
    >()

    const element = (
      <NumberField {...commitProps}>
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrease" />
          <NumberField.Input aria-label="Price" />
          <NumberField.Increment aria-label="Increase" />
        </NumberField.Group>
      </NumberField>
    )
    expect(React.isValidElement(element)).toBe(true)

    // @ts-expect-error - unknown commit behavior rejected
    const _badBehavior: NumberFieldProps = { value: null, locale: 'en-US', commitBehavior: 'clamp' }
    expect(_badBehavior).toBeDefined()

    // @ts-expect-error - formatOptions must be Intl-shaped
    const _badFormat: NumberFieldProps = { value: null, locale: 'en-US', formatOptions: 'USD' }
    expect(_badFormat).toBeDefined()
  })
})

import * as React from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  NumberField,
  type NumberFieldDecrementProps,
  type NumberFieldIncrementProps,
  type NumberFieldInputProps,
  type NumberFieldProps,
} from './NumberField'

describe('NumberField type contract', () => {
  it('NF-TYPE-01: NumberField should export the conventional root and no Root alias', () => {
    expect(NumberField).toBeDefined()
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
      locale: 'en-US',
      width: '40r',
    }
    expect(validProps.value).toBe(123.45)
    expect(typeof validProps.onChange).toBe('function')

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
        <NumberField.Decrement {...validDecProps} />
        <NumberField.Input {...validInputProps} />
        <NumberField.Increment {...validIncProps} />
      </NumberField>
    )
    expect(React.isValidElement(element)).toBe(true)

    expectTypeOf<NumberFieldProps['value']>().toEqualTypeOf<number | null>()
    expectTypeOf<NumberFieldProps['onChange']>().toEqualTypeOf<((value: number | null) => void) | undefined>()
    expectTypeOf<NumberFieldProps['min']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['max']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['step']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['disabled']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<NumberFieldProps['locale']>().toEqualTypeOf<string>()

    // @ts-expect-error - string value rejected
    const _strVal: NumberFieldProps = { value: '123', locale: 'en-US' }
    expect(_strVal).toBeDefined()

    // @ts-expect-error - raw text callback rejected
    const _rawCb: NumberFieldProps = { value: null, locale: 'en-US', onTextChange: (s: string) => void s }
    expect(_rawCb).toBeDefined()

    // NOTE: role/type/aria-valuenow stay in the public part types (no Omit
    // churn); at runtime each part owns them (conflicting casts stripped,
    // managed values win). aria-label stays consumer-overridable by design.
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
        <NumberField.Decrement aria-label="Decrease" />
        <NumberField.Input />
        <NumberField.Increment aria-label="Increase" onClick={() => {}}>
          +
        </NumberField.Increment>
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
})

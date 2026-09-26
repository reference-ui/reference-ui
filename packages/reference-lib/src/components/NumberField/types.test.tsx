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
  it('NF-TYPE-01: NumberField should export the conventional parts with no Root alias', () => {
    expect(NumberField).toBeDefined()
    expect(NumberField.Input).toBeDefined()
    expect(NumberField.Increment).toBeDefined()
    expect(NumberField.Decrement).toBeDefined()

    // @ts-expect-error - NumberField.Root does not exist
    const _noRoot = NumberField.Root
    expect(_noRoot).toBeUndefined()
  })

  it('NF-TYPE-02: NumberField should type one numeric request authority with uncontrolled mode preserved', () => {
    // Landing re-target: defaultValue is intentionally allowed and locale
    // stays optional with an 'en-US' default (uncontrolled mode preserved
    // per recon exhibit 1), unlike the TESTS.md freeze catalog which
    // requires controlled value + locale.
    const validProps: NumberFieldProps = {
      value: 123.45,
      defaultValue: null,
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

    expectTypeOf<NumberFieldProps['value']>().toEqualTypeOf<number | null | undefined>()
    expectTypeOf<NumberFieldProps['defaultValue']>().toEqualTypeOf<number | null | undefined>()
    expectTypeOf<NumberFieldProps['onChange']>().toEqualTypeOf<((value: number | null) => void) | undefined>()
    expectTypeOf<NumberFieldProps['min']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['max']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['step']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<NumberFieldProps['disabled']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<NumberFieldProps['locale']>().toEqualTypeOf<string | undefined>()

    // @ts-expect-error - string value rejected
    const _strVal: NumberFieldProps = { value: '123' }
    expect(_strVal).toBeDefined()

    // @ts-expect-error - raw text callback rejected
    const _rawCb: NumberFieldProps = { value: null, onTextChange: (s: string) => void s }
    expect(_rawCb).toBeDefined()

    // NOTE: role/type/aria-valuenow stay in the public part types (no Omit
    // churn); at runtime each part owns them (conflicting casts stripped,
    // managed values win). aria-label stays consumer-overridable by design.
  })
})

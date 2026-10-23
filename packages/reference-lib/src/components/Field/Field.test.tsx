/**
 * Field type proof: role and validity ARIA stay omitted from the public
 * props. Compile-time only; runtime stripping proves out beside it and
 * in CT. It also pins the Div typography selector at one class, so the
 * bezel's own font size wins by source order.
 */
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { Field, type FieldProps } from './index'
import { base } from '../../core/theme/primitives/base'
import { documentPrimitiveStyles } from '../../core/theme/primitives/document'

describe('Field Unit Contract', () => {
  it('FI-TYPE-01: Field should omit role and validity ARIA from its public type', () => {
    // Compile Field with StyleProps and status="warning"
    const validElement = (
      <Field
        status="warning"
        p="2r"
        m="1r"
        border="1px solid"
        display="flex"
      >
        <input />
      </Field>
    )
    expect(validElement).toBeDefined()

    // Assert type errors on omitted or invalid props:
    // @ts-expect-error - role is omitted from public type
    const _invalidRole: FieldProps = { role: 'group' }

    // @ts-expect-error - aria-invalid is omitted from public type
    const _invalidAriaInvalid: FieldProps = { 'aria-invalid': 'true' }

    // @ts-expect-error - aria-disabled is omitted from public type
    const _invalidAriaDisabled: FieldProps = { 'aria-disabled': 'true' }

    // @ts-expect-error - aria-readonly is omitted from public type
    const _invalidAriaReadonly: FieldProps = { 'aria-readonly': 'true' }

    // @ts-expect-error - aria-required is omitted from public type
    const _invalidAriaRequired: FieldProps = { 'aria-required': 'true' }

    // @ts-expect-error - aria-errormessage is omitted from public type
    const _invalidAriaErrormessage: FieldProps = { 'aria-errormessage': 'error-id' }

    // @ts-expect-error - status="error" is not allowed (only "warning" or omitted)
    const _invalidStatus: FieldProps = { status: 'error' }

    expect(Field).toBeDefined()
  })
})

// The bezel is a Div carrying [data-reference-field]; field.ts sets its font
// size and wins over the Div typography pin only by source order, so the pin
// must stay one class (0,1,0) while still skipping icon slots.
describe('Div typography pin specificity', () => {
  it('keeps every .ref-div pin at one-class specificity so the field font size wins', () => {
    const parts = [...Object.keys(base), ...Object.keys(documentPrimitiveStyles)]
      .flatMap(selector => selector.split(','))
      .map(part => part.trim())
      .filter(part => /\.ref-div\b/.test(part))

    expect(parts.length).toBeGreaterThanOrEqual(2)
    for (const part of parts) {
      expect(part).toBe('.ref-div:where(:not([data-slot="icon"]))')
    }
  })
})

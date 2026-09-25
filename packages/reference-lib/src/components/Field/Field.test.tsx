import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { Field, type FieldProps } from './index'

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

import { describe, expect, it } from 'vitest'
import { stripProhibitedFieldProps } from './strip-prohibited'

describe('stripProhibitedFieldProps', () => {
  it('removes the six prohibited keys and keeps everything else', () => {
    const input = {
      role: 'group',
      'aria-invalid': 'true',
      'aria-disabled': 'true',
      'aria-readonly': 'true',
      'aria-required': 'true',
      'aria-errormessage': 'error-id',
      'data-testid': 'test-field',
      'data-status': 'warning',
      width: '100%',
      onClick: () => {},
    }
    const rest = stripProhibitedFieldProps(input)
    expect(rest).toEqual({
      'data-testid': 'test-field',
      'data-status': 'warning',
      width: '100%',
      onClick: input.onClick,
    })
  })

  it('returns a fresh object and leaves the input untouched', () => {
    const input = { role: 'group', id: 'username' }
    const rest = stripProhibitedFieldProps(input)
    expect(rest).not.toBe(input)
    expect(input).toEqual({ role: 'group', id: 'username' })
  })

  it('passes an already-clean record through by value', () => {
    expect(stripProhibitedFieldProps({})).toEqual({})
  })
})

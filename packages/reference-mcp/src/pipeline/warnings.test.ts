import { describe, expect, it } from 'vitest'
import { formatReferenceWarning } from './warnings'

describe('formatReferenceWarning', () => {
  it('leads with the location and keeps only the subject line of the message', () => {
    expect(
      formatReferenceWarning({
        severity: 'warning',
        code: 'TST-W-DUPLICATE-MEMBER',
        message: 'duplicate member variant\nsecond line is not part of the one-liner',
        file: './src/components/Button.tsx',
        line: 4,
        column: 3,
      })
    ).toBe(
      './src/components/Button.tsx:4:3 TST-W-DUPLICATE-MEMBER duplicate member variant'
    )
  })

  it('renders a request-level diagnostic as code and subject only', () => {
    expect(
      formatReferenceWarning({
        severity: 'warning',
        code: 'TST-W-PARSE-ERROR',
        message: 'could not parse manifest',
      })
    ).toBe('TST-W-PARSE-ERROR could not parse manifest')
  })
})

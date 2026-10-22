// Unit tests for the bridge failure line.
// A failed tasty build prints one `[ref]` diagnostic line with its TST code and its message, and never the raw error with its
// stack. Each test calls the formatter or the logger directly and checks the exact line it writes.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatReferenceFailure, logReferenceError } from './logging.ts'

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

describe('formatReferenceFailure', () => {
  it('leads with the TST code and the message on one line, with no stack', () => {
    const error = new Error(
      'TST-E-SCAN-FAILED: failed to walk scan root: File system loop found: /p/src/loopB points to an ancestor /p/src'
    )
    const line = formatReferenceFailure(error).replace(ANSI, '')
    expect(line).toBe(
      '  [ref] TST-E-SCAN-FAILED: reference tasty build failed: failed to walk scan root: File system loop found: /p/src/loopB points to an ancestor /p/src'
    )
    expect(line).not.toContain('\n')
    expect(line).not.toContain('    at ')
  })

  it('prints an uncoded failure as a codeless error line', () => {
    const line = formatReferenceFailure(new Error('config failed to load')).replace(ANSI, '')
    expect(line).toBe('  [ref] reference tasty build failed: config failed to load')
  })

  it('collapses a multi-line message into the one line', () => {
    const line = formatReferenceFailure(new Error('native compile failed:\n- ATM-E-X: bad')).replace(ANSI, '')
    expect(line).not.toContain('\n')
    expect(line).toContain('native compile failed: - ATM-E-X: bad')
  })
})

describe('logReferenceError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes one string line to stderr and never passes the error object', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    logReferenceError(new Error('TST-E-SCAN-FAILED: failed to walk scan root: boom'))
    expect(spy).toHaveBeenCalledTimes(1)
    const args = spy.mock.calls[0] ?? []
    expect(args).toHaveLength(1)
    expect(typeof args[0]).toBe('string')
    expect(String(args[0]).replace(ANSI, '')).toContain('TST-E-SCAN-FAILED: reference tasty build failed:')
  })
})

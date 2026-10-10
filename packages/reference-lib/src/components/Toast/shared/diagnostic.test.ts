/** Isolation proof for diagnostics: development warnings. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toastDiagnostic } from './diagnostic'

describe('toastDiagnostic', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits a development warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    toastDiagnostic('hello')
    expect(warn).toHaveBeenCalledWith('[reference-ui] hello')
  })
})

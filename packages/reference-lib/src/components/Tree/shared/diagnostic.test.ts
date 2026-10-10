import { afterEach, describe, expect, it, vi } from 'vitest'
import { treeDiagnostic } from './diagnostic'

describe('treeDiagnostic', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('errors with the Tree prefix outside production', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    treeDiagnostic('nested onChange is ignored')
    expect(error).toHaveBeenCalledWith(
      '[reference-ui] Tree: nested onChange is ignored'
    )
  })

  it('stays silent in production', () => {
    const proc = (globalThis as { process: { env: Record<string, string | undefined> } }).process
    const prev = proc.env.NODE_ENV
    proc.env.NODE_ENV = 'production'
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      treeDiagnostic('silent probe')
      expect(error).not.toHaveBeenCalled()
    } finally {
      if (prev === undefined) {
        delete proc.env.NODE_ENV
      } else {
        proc.env.NODE_ENV = prev
      }
    }
  })
})

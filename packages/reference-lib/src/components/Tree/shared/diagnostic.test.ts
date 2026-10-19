/**
 * Proof for the Tree diagnostic channel. Pins the `[reference-ui] Tree`
 * prefix outside production, and silence in production.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { treeDiagnostic } from './diagnostic'

describe('treeDiagnostic', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
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
    vi.stubEnv('NODE_ENV', 'production')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    treeDiagnostic('silent probe')
    expect(error).not.toHaveBeenCalled()
  })
})

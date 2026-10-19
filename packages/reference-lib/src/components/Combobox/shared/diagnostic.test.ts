/**
 * Combobox diagnostic proof: dev warning shape and channel. Pins the
 * warning every Combobox module reports through.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { comboboxDiagnostic } from './diagnostic'

describe('comboboxDiagnostic', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('errors with the Combobox prefix outside production', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    comboboxDiagnostic('at most one Popover')
    expect(error).toHaveBeenCalledWith('[reference-ui] Combobox: at most one Popover')
  })

  it('stays silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    comboboxDiagnostic('silent probe')
    expect(error).not.toHaveBeenCalled()
  })
})

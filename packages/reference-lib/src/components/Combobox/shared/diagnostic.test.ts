import { afterEach, describe, expect, it, vi } from 'vitest'
import { comboboxDiagnostic } from './diagnostic'

describe('comboboxDiagnostic', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('errors with the Combobox prefix outside production', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    comboboxDiagnostic('at most one Popover')
    expect(error).toHaveBeenCalledWith('[reference-ui] Combobox: at most one Popover')
  })

  it('stays silent in production', () => {
    const proc = (globalThis as { process: { env: Record<string, string | undefined> } }).process
    const prev = proc.env.NODE_ENV
    proc.env.NODE_ENV = 'production'
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      comboboxDiagnostic('silent probe')
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

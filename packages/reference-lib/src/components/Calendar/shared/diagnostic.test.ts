/**
 * Calendar diagnostic proof: dev warning shape and channel. Pins the
 * warning every Calendar module reports through.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { calendarDevDiagnostic } from './diagnostic'

describe('calendarDevDiagnostic', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes one prefixed error outside production', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    calendarDevDiagnostic('invalid month "2024-13".')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('[reference-ui] Calendar: invalid month "2024-13".')
  })
})

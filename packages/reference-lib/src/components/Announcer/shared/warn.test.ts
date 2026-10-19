/**
 * Announcer diagnostic proof: prefixed warnings, once per message shape.
 * Pins the dev channel every runtime module warns through.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { announcerDiagnostic } from './warn'

describe('announcerDiagnostic', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prefixes warnings and warns once per message shape', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    announcerDiagnostic('warn-test shape-a')
    announcerDiagnostic('warn-test shape-a')
    announcerDiagnostic('warn-test shape-b')
    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledWith('[reference-ui] warn-test shape-a')
    expect(warn).toHaveBeenCalledWith('[reference-ui] warn-test shape-b')
  })
})

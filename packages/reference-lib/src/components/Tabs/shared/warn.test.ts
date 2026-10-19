/**
 * Proof for the Tabs dev warning channel. Pins the Tabs name and mismatch
 * in dev, and silence in production.
 */
import { describe, expect, it, vi, afterEach } from 'vitest'
import { warnTabs } from './warn'

describe('warnTabs', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('names Tabs and the mismatch in dev', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    warnTabs('value "zzz" matches no Tab (registered values: a, b).')
    expect(spy).toHaveBeenCalledWith(
      'Reference UI: Tabs value "zzz" matches no Tab (registered values: a, b).'
    )
  })

  it('stays silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    warnTabs('anything')
    expect(spy).not.toHaveBeenCalled()
  })
})

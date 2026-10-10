import { describe, expect, it, vi, afterEach } from 'vitest'
import { devWarn } from './warn'

describe('devWarn', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('prefixes structural misuse with Reference UI in dev', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    devWarn('Menu.Trigger is valid only when nested inside a submenu Menu.')
    expect(spy).toHaveBeenCalledWith(
      'Reference UI: Menu.Trigger is valid only when nested inside a submenu Menu.'
    )
  })

  it('stays silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    devWarn('anything')
    expect(spy).not.toHaveBeenCalled()
  })
})

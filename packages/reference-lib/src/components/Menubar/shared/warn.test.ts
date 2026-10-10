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
    devWarn('Menubar.Menu must be used inside a Menubar root.')
    expect(spy).toHaveBeenCalledWith(
      'Reference UI: Menubar.Menu must be used inside a Menubar root.'
    )
  })

  it('stays silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    devWarn('anything')
    expect(spy).not.toHaveBeenCalled()
  })
})

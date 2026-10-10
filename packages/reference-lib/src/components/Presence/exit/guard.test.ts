import { describe, expect, it } from 'vitest'
import { ExitGuard } from './guard'

/**
 * Unit proof for `exit/guard`: the W-09 once-guard. Pins exactly-once exit
 * completion (PR-EXIT-01/03, PR-RACE-03) without a browser.
 */

describe('ExitGuard', () => {
  it('completes exactly once per epoch', () => {
    const guard = new ExitGuard()
    guard.begin()
    expect(guard.complete()).toBe(true)
    expect(guard.complete()).toBe(false)
    expect(guard.complete()).toBe(false)
  })

  it('never completes before an exit begins', () => {
    expect(new ExitGuard().complete()).toBe(false)
  })

  it('voids the live epoch on cancel so interrupted exits stay silent', () => {
    const guard = new ExitGuard()
    guard.begin()
    guard.cancel()
    expect(guard.complete()).toBe(false)
  })

  it('opens a fresh claimable epoch after reopen and reclose', () => {
    const guard = new ExitGuard()
    guard.begin()
    guard.cancel()
    expect(guard.complete()).toBe(false)
    guard.begin()
    expect(guard.complete()).toBe(true)
    expect(guard.complete()).toBe(false)
  })
})

/**
 * Lock-id proof: unique lock-N tokens across calls. Pure counter with no
 * DOM; sessions label themselves from it.
 */
import { describe, expect, it } from 'vitest'
import { nextLockId } from './ids'

describe('lock ids', () => {
  it('hands out unique lock-N tokens', () => {
    const first = nextLockId()
    const second = nextLockId()
    expect(first).toMatch(/^lock-\d+$/)
    expect(second).toMatch(/^lock-\d+$/)
    expect(second).not.toBe(first)
  })
})

/** Isolation proof for nextLockId: unique lock-N tokens across calls. */
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

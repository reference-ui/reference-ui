/**
 * Isolated proof for `nextSlotRegistrationId`: every call mints a fresh
 * `slot-reg-N` id from the shared process-wide sequence, so concurrent
 * contexts and `StrictMode` remounts can never collide.
 */
import { describe, expect, it } from 'vitest'
import { nextSlotRegistrationId } from './ids'

describe('nextSlotRegistrationId', () => {
  it('mints unique slot-reg-N ids in increasing order', () => {
    const first = nextSlotRegistrationId()
    const second = nextSlotRegistrationId()

    expect(first).toMatch(/^slot-reg-\d+$/)
    expect(second).toMatch(/^slot-reg-\d+$/)
    expect(second).not.toBe(first)
    expect(Number(second.split('-')[2])).toBeGreaterThan(Number(first.split('-')[2]))
  })
})

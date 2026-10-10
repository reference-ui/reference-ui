/** Isolation proof for ID minting: distinct toast-prefixed strings. */
import { describe, expect, it } from 'vitest'
import { generateToastId } from './ids'

describe('toast ids', () => {
  it('mints distinct toast-prefixed string IDs', () => {
    const first = generateToastId()
    const second = generateToastId()
    expect(first).toMatch(/^toast-/)
    expect(typeof first).toBe('string')
    expect(first).not.toBe(second)
  })
})

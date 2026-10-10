import { describe, expect, it } from 'vitest'
import { UNCONSUMED, consumeMenuEntryIntent, setMenuEntryIntent } from './entry'

describe('menu entry intent cell', () => {
  it('consumes a planted strategy exactly once', () => {
    setMenuEntryIntent('first')
    expect(consumeMenuEntryIntent()).toBe('first')
    expect(consumeMenuEntryIntent()).toBeNull()
  })

  it('last plant wins and null clears', () => {
    setMenuEntryIntent('first')
    setMenuEntryIntent('last')
    expect(consumeMenuEntryIntent()).toBe('last')
    setMenuEntryIntent('first')
    setMenuEntryIntent(null)
    expect(consumeMenuEntryIntent()).toBeNull()
  })

  it('UNCONSUMED is distinct from every strategy', () => {
    expect(UNCONSUMED).not.toBe('first')
    expect(UNCONSUMED).not.toBe('last')
    expect(UNCONSUMED).not.toBeNull()
    expect(typeof UNCONSUMED).toBe('symbol')
  })
})

import { describe, expect, it } from 'vitest'
import { isGroupWarmed, type TooltipGroupState } from './tooltipGroup'

function state(partial: Partial<TooltipGroupState> = {}): TooltipGroupState {
  return {
    activeId: null,
    pendingId: null,
    warmUntil: 0,
    skipDelay: 300,
    ...partial,
  }
}

describe('tooltipGroup skip-delay', () => {
  it('is cold until an instance is active or the skip window is live', () => {
    expect(isGroupWarmed(state(), 1_000)).toBe(false)
    expect(isGroupWarmed(state({ activeId: 'a' }), 1_000)).toBe(true)
    expect(isGroupWarmed(state({ warmUntil: 1_300 }), 1_000)).toBe(true)
    expect(isGroupWarmed(state({ warmUntil: 1_300 }), 1_300)).toBe(false)
  })

  it('never enters an instant phase when skipDelay is 0', () => {
    expect(isGroupWarmed(state({ skipDelay: 0, activeId: 'a', warmUntil: 99_999 }), 1)).toBe(false)
  })
})

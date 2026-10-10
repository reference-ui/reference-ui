import { describe, expect, it, vi, afterEach } from 'vitest'
import { clearIntentTimer, freshIntentState } from './intent-state'

describe('submenu intent state', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no timers, samples, or flags', () => {
    expect(freshIntentState()).toEqual({
      openTimer: null,
      closeTimer: null,
      leavePoint: null,
      prevSample: null,
      keyboardOpen: false,
      closeRequested: false,
    })
  })

  it('clearIntentTimer kills only the named timer', () => {
    vi.useFakeTimers()
    const state = freshIntentState()
    const opened: string[] = []
    const closed: string[] = []
    state.openTimer = setTimeout(() => opened.push('open'), 100)
    state.closeTimer = setTimeout(() => closed.push('close'), 300)
    clearIntentTimer(state, 'openTimer')
    expect(state.openTimer).toBeNull()
    expect(state.closeTimer).not.toBeNull()
    vi.advanceTimersByTime(500)
    expect(opened).toEqual([])
    expect(closed).toEqual(['close'])
  })

  it('clearing an empty slot is a no-op', () => {
    const state = freshIntentState()
    expect(() => clearIntentTimer(state, 'closeTimer')).not.toThrow()
    expect(state.closeTimer).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import {
  defaultSwipeDirections,
  isAllowedSwipe,
  isToastPausedByOverlay,
  matchesHotkey,
  remainingAfterElapsed,
  shouldAutoDismiss,
  shouldDismissSwipe,
  splitPromiseResult,
  visibleToasts,
  waitingToasts,
} from './toastQueue'

describe('toast queue FIFO', () => {
  it('keeps the oldest records visible and excess waiting', () => {
    const toasts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(visibleToasts(toasts, 2).map(t => t.id)).toEqual(['a', 'b'])
    expect(waitingToasts(toasts, 2).map(t => t.id)).toEqual(['c'])
  })

  it('promotes the oldest waiter when a visible slot is released', () => {
    const afterDismiss = [{ id: 'b' }, { id: 'c' }]
    expect(visibleToasts(afterDismiss, 2).map(t => t.id)).toEqual(['b', 'c'])
    expect(waitingToasts(afterDismiss, 2)).toEqual([])
  })
})

describe('toast remaining time', () => {
  it('accumulates only active elapsed time across pause and resume', () => {
    let remaining: number | false = 5000
    remaining = remainingAfterElapsed(remaining, 1000) as number
    remaining = remainingAfterElapsed(remaining, 0) as number
    remaining = remainingAfterElapsed(remaining, 1000) as number
    expect(remaining).toBe(3000)
    expect(shouldAutoDismiss(remainingAfterElapsed(remaining, 2999))).toBe(false)
    expect(shouldAutoDismiss(remainingAfterElapsed(remaining, 3000))).toBe(true)
  })

  it('never schedules auto-dismiss for false (untimed) remaining', () => {
    expect(remainingAfterElapsed(false, 60_000)).toBe(false)
    expect(shouldAutoDismiss(false)).toBe(false)
  })
})

describe('toast swipe threshold', () => {
  it('dismisses on distance or velocity', () => {
    expect(shouldDismissSwipe(76, 0)).toBe(true)
    expect(shouldDismissSwipe(10, 0.51)).toBe(true)
    expect(shouldDismissSwipe(75, 0.5)).toBe(false)
  })

  it('allows swipe toward the screen edge for the occupied position', () => {
    expect(defaultSwipeDirections('bottom-end')).toEqual(['bottom', 'right'])
    expect(defaultSwipeDirections('top-start')).toEqual(['top', 'left'])
    expect(defaultSwipeDirections('top-center')).toEqual(['top', 'left', 'right'])
    expect(isAllowedSwipe('x', 40, ['bottom', 'right'])).toBe(true)
    expect(isAllowedSwipe('x', -40, ['bottom', 'right'])).toBe(false)
    expect(isAllowedSwipe('y', 20, ['bottom', 'right'])).toBe(true)
    expect(isAllowedSwipe('y', -20, ['bottom', 'right'])).toBe(false)
  })
})

describe('toast promise result', () => {
  it('splits Sonner extended results and leaves strings and elements alone', () => {
    expect(splitPromiseResult('Saved')).toBeNull()
    expect(splitPromiseResult(null)).toBeNull()
    expect(splitPromiseResult({ $$typeof: Symbol.for('react.element'), message: 'x' })).toBeNull()
    expect(splitPromiseResult({ message: 'Done', description: 'File saved', duration: 2000 })).toEqual({
      message: 'Done',
      options: { description: 'File saved', duration: 2000 },
    })
  })
})

describe('toast overlay-stack pause', () => {
  it('pauses from isolation.inert / isModal, not another document', () => {
    const docA = { id: 'a' } as unknown as Document
    const docB = { id: 'b' } as unknown as Document
    expect(isToastPausedByOverlay([{ isModal: false, isolation: { inert: false } }])).toBe(false)
    expect(isToastPausedByOverlay([{ isModal: true, isolation: { inert: true } }])).toBe(true)
    expect(
      isToastPausedByOverlay([{ isModal: false, isolation: { inert: true }, document: docA }], docA)
    ).toBe(true)
    expect(
      isToastPausedByOverlay([{ isModal: true, isolation: { inert: true }, document: docB }], docA)
    ).toBe(false)
  })
})

describe('toast hotkey', () => {
  const altT = {
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    code: 'KeyT',
    key: 't',
  }

  it('matches the Sonner default and can be suppressed', () => {
    expect(matchesHotkey(altT, ['altKey', 'KeyT'])).toBe(true)
    expect(matchesHotkey(altT, false)).toBe(false)
    expect(matchesHotkey(altT, [])).toBe(false)
    expect(matchesHotkey({ ...altT, altKey: false }, ['altKey', 'KeyT'])).toBe(false)
  })
})

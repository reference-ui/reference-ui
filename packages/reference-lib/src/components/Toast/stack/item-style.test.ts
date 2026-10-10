/** Isolation proof for item presentation: peeks, expansion, gating, entry. */
import { describe, expect, it } from 'vitest'
import { toastItemStyle, type ToastItemGeometry } from './item-style'

function geometry(extra?: Partial<ToastItemGeometry>): ToastItemGeometry {
  return {
    index: 0,
    totalCount: 3,
    frontOffset: 0,
    expandedOffset: 0,
    isExpanded: false,
    isTop: false,
    entered: true,
    reducedMotion: false,
    isDragging: false,
    isFocused: false,
    dragOffset: { x: 0, y: 0 },
    dataState: 'open',
    swipeOut: false,
    dismissible: true,
    swipeLocked: false,
    ...extra,
  }
}

describe('toast item style', () => {
  it('peeks and shrinks collapsed cards behind the front', () => {
    const front = toastItemStyle(geometry()) as Record<string, string>
    expect(front['--reference-toast-offset']).toBe('0px')
    expect(front['--reference-toast-scale']).toBe('1')
    const behind = toastItemStyle(geometry({ frontOffset: 2 })) as Record<string, string>
    expect(behind['--reference-toast-offset']).toBe('-28px')
    expect(behind['--reference-toast-scale']).toBe('0.9')
    const deep = toastItemStyle(geometry({ frontOffset: 9 })) as Record<string, string>
    expect(deep['--reference-toast-scale']).toBe('0.85')
  })

  it('sits expanded cards at measured offsets full-scale', () => {
    const style = toastItemStyle(
      geometry({ isExpanded: true, frontOffset: 2, expandedOffset: 144 })
    ) as Record<string, string>
    expect(style['--reference-toast-offset']).toBe('-144px')
    expect(style['--reference-toast-scale']).toBe('1')
  })

  it('gates pointer events before enter and beyond the peek window', () => {
    expect(toastItemStyle(geometry({ entered: false })).pointerEvents).toBe('none')
    expect(toastItemStyle(geometry({ frontOffset: 3 })).pointerEvents).toBe('none')
    expect(toastItemStyle(geometry({ frontOffset: 3, isExpanded: true })).pointerEvents).toBe('auto')
  })

  it('slides closed cards in from the stack edge', () => {
    const bottom = toastItemStyle(geometry({ dataState: 'closed' })) as Record<string, string>
    expect(bottom['--reference-toast-enter']).toBe('100%')
    const top = toastItemStyle(geometry({ dataState: 'closed', isTop: true })) as Record<string, string>
    expect(top['--reference-toast-enter']).toBe('-100%')
    const out = toastItemStyle(geometry({ dataState: 'closed', swipeOut: true })) as Record<string, string>
    expect(out['--reference-toast-enter']).toBe('0px')
  })
})

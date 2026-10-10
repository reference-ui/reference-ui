/** Isolation proof for stack math: windows, grouping, offsets, peeks, widths. */
import { describe, expect, it } from 'vitest'
import type { ToastItem } from '../types'
import {
  collapsedStackHeight,
  expandedItemOffsets,
  expandedTotalHeight,
  groupToastsByPosition,
  shownToasts,
  stackWidth,
} from './layout'

function item(id: string, extra?: Partial<ToastItem>): ToastItem {
  return { id, generation: 1, createdAt: 0, dismissible: true, ...extra } as ToastItem
}

describe('toast stack layout', () => {
  it('shows the visible window plus exiting records', () => {
    const toasts = [item('a'), item('b'), item('c', { exiting: true }), item('d')]
    expect(shownToasts(toasts, 2).map(t => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('groups by position with fallback', () => {
    const grouped = groupToastsByPosition(
      [item('a', { position: 'top-start' }), item('b'), item('c', { position: 'top-start' })],
      'bottom-end'
    )
    expect(Array.from(grouped.keys())).toEqual(['top-start', 'bottom-end'])
    expect(grouped.get('top-start')?.map(t => t.id)).toEqual(['a', 'c'])
    expect(grouped.get('bottom-end')?.map(t => t.id)).toEqual(['b'])
  })

  it('accumulates expanded offsets from the front by measured heights', () => {
    const toasts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(expandedItemOffsets(toasts, { a: 50, b: 60, c: 70 }, 14)).toEqual([158, 84, 0])
    expect(expandedItemOffsets(toasts, {}, 14)).toEqual([164, 82, 0])
    expect(expandedTotalHeight(toasts, { a: 50, b: 60, c: 70 }, 14)).toBe(208)
    expect(expandedTotalHeight([], {}, 14)).toBe(0)
  })

  it('peeks at most two cards behind the collapsed front', () => {
    expect(collapsedStackHeight(70, 1)).toBe(70)
    expect(collapsedStackHeight(70, 2)).toBe(84)
    expect(collapsedStackHeight(70, 5)).toBe(98)
  })

  it('fixes desktop width and spans side-aligned mobile viewports', () => {
    expect(
      stackWidth({ mobile: false, sideAligned: true, activeOffset: undefined, fallback: '24px' })
    ).toBe('356px')
    expect(
      stackWidth({ mobile: true, sideAligned: true, activeOffset: undefined, fallback: '16px' })
    ).toBe('calc(100vw - 16px - 16px)')
    expect(
      stackWidth({ mobile: true, sideAligned: false, activeOffset: undefined, fallback: '16px' })
    ).toBe('356px')
  })
})

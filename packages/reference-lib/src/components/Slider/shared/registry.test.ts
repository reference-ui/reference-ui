// @vitest-environment happy-dom
/** Unit proof for the slider thumb registry order: mount ids rank by
 * live document position with registration order as the incomparable
 * fallback, and the count-mismatch diagnostic keeps singular/plural
 * agreement. */
import { describe, expect, it } from 'vitest'
import { countMismatchMessage, sortThumbIdsByDomOrder } from './registry'

describe('slider thumb registry order', () => {
  it('phrases the count mismatch with singular and plural agreement', () => {
    expect(countMismatchMessage(1, 2)).toBe(
      '[Slider] Value-to-Thumb count mismatch: value has 1 entry but 2 Thumbs are registered'
    )
    expect(countMismatchMessage(2, 1)).toBe(
      '[Slider] Value-to-Thumb count mismatch: value has 2 entries but 1 Thumb is registered'
    )
  })

  it('ranks mount ids by document position, not registration order', () => {
    const host = document.createElement('div')
    const first = document.createElement('div')
    const second = document.createElement('div')
    const third = document.createElement('div')
    host.append(first, second, third)
    document.body.appendChild(host)
    try {
      const registry = new Map<number, HTMLDivElement>([
        [7, third],
        [3, first],
        [5, second],
      ])
      expect(sortThumbIdsByDomOrder(registry)).toEqual([3, 5, 7])
    } finally {
      host.remove()
    }
  })

  it('keeps registration order when nodes are incomparable', () => {
    const throwing = () => {
      throw new Error('no layout')
    }
    const registry = new Map<number, HTMLDivElement>([
      [2, { compareDocumentPosition: throwing } as unknown as HTMLDivElement],
      [1, { compareDocumentPosition: throwing } as unknown as HTMLDivElement],
    ])
    expect(sortThumbIdsByDomOrder(registry)).toEqual([2, 1])
  })
})

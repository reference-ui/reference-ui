/**
 * Reclaim-landing proof: memory order and lazy querying. Pure landing
 * decisions with no DOM; the containment effect applies them.
 */
import { describe, expect, it, vi } from 'vitest'
import { pickFallbackTarget } from './fallback'

function node(): HTMLElement {
  return {} as unknown as HTMLElement
}

describe('pickFallbackTarget', () => {
  it('prefers the last live inside node, then its predecessor', () => {
    const last = node()
    const previous = node()
    const container = node()
    const listFirst = vi.fn(() => node())
    const usable = (candidate: HTMLElement) => candidate === last || candidate === previous
    expect(pickFallbackTarget({ last, previous, container, listFirst, isUsable: usable })).toBe(
      last
    )
    expect(listFirst).not.toHaveBeenCalled()
    const usablePrevious = (candidate: HTMLElement) => candidate === previous
    expect(
      pickFallbackTarget({ last, previous, container, listFirst, isUsable: usablePrevious })
    ).toBe(previous)
  })

  it('falls back to the first candidate when memory is unusable', () => {
    const container = node()
    const first = node()
    expect(
      pickFallbackTarget({
        last: node(),
        previous: null,
        container,
        listFirst: () => first,
        isUsable: () => false,
      })
    ).toBe(first)
    expect(
      pickFallbackTarget({
        last: null,
        previous: null,
        container,
        listFirst: () => container,
        isUsable: () => false,
      })
    ).toBe(container)
  })
})

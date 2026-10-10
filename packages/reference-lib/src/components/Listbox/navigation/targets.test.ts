import { describe, expect, it } from 'vitest'
import { resolveStandaloneTarget, resolveVirtualTarget } from './targets'

describe('resolveStandaloneTarget', () => {
  it('moves vertically with wraparound and holds on other keys', () => {
    expect(resolveStandaloneTarget(4, 0, 'ArrowDown', 'vertical', false)).toBe(1)
    expect(resolveStandaloneTarget(4, 3, 'ArrowDown', 'vertical', false)).toBe(0)
    expect(resolveStandaloneTarget(4, 0, 'ArrowUp', 'vertical', false)).toBe(3)
    expect(resolveStandaloneTarget(4, 1, 'Enter', 'vertical', false)).toBe(1)
  })

  it('swaps horizontal direction in RTL', () => {
    expect(resolveStandaloneTarget(4, 1, 'ArrowRight', 'horizontal', false)).toBe(2)
    expect(resolveStandaloneTarget(4, 1, 'ArrowRight', 'horizontal', true)).toBe(0)
    expect(resolveStandaloneTarget(4, 1, 'ArrowLeft', 'horizontal', true)).toBe(2)
  })

  it('jumps to the ends on Home and End regardless of orientation', () => {
    expect(resolveStandaloneTarget(4, 2, 'Home', 'vertical', false)).toBe(0)
    expect(resolveStandaloneTarget(4, 2, 'End', 'horizontal', true)).toBe(3)
  })
})

describe('resolveVirtualTarget', () => {
  const items = [{}, { disabled: true }, {}, {}]

  it('skips disabled items when stepping', () => {
    expect(resolveVirtualTarget(items, 0, 'ArrowDown', 'vertical', false)).toBe(2)
    expect(resolveVirtualTarget(items, 2, 'ArrowUp', 'vertical', false)).toBe(0)
    expect(resolveVirtualTarget(items, 3, 'ArrowDown', 'vertical', false)).toBe(0)
  })

  it('lands Home and End on the first and last enabled items', () => {
    expect(resolveVirtualTarget(items, 2, 'Home', 'vertical', false)).toBe(0)
    expect(resolveVirtualTarget(items, 0, 'End', 'vertical', false)).toBe(3)
    expect(resolveVirtualTarget([{ disabled: true }], 0, 'Home', 'vertical', false)).toBe(0)
    expect(resolveVirtualTarget([{ disabled: true }], 0, 'End', 'vertical', false)).toBe(0)
  })

  it('holds position on non-navigation keys', () => {
    expect(resolveVirtualTarget(items, 2, 'Enter', 'vertical', false)).toBe(2)
  })
})

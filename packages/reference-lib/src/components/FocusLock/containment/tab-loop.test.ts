/** Isolation proof for the Tab decision: stepping, wrap, and re-entry. */
import { describe, expect, it } from 'vitest'
import { resolveTabTarget } from './tab-loop'

function node(): HTMLElement {
  return {} as unknown as HTMLElement
}

describe('resolveTabTarget', () => {
  it('steps through the list and wraps at both edges', () => {
    const a = node()
    const b = node()
    const c = node()
    const list = [a, b, c]
    expect(resolveTabTarget(list, a, false, true)).toBe(b)
    expect(resolveTabTarget(list, b, false, true)).toBe(c)
    expect(resolveTabTarget(list, c, false, true)).toBe(a)
    expect(resolveTabTarget(list, c, true, true)).toBe(b)
    expect(resolveTabTarget(list, b, true, true)).toBe(a)
    expect(resolveTabTarget(list, a, true, true)).toBe(c)
  })

  it('re-enters at the near edge when focus starts outside', () => {
    const a = node()
    const c = node()
    const list = [a, c]
    expect(resolveTabTarget(list, null, false, false)).toBe(a)
    expect(resolveTabTarget(list, null, true, false)).toBe(c)
    expect(resolveTabTarget(list, node(), false, false)).toBe(a)
    expect(resolveTabTarget(list, node(), true, false)).toBe(c)
    expect(resolveTabTarget(list, node(), false, true)).toBe(a)
  })
})

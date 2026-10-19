/**
 * Ref-assignment proof for setRef: function passthrough, object writes,
 * and gaps. Runs against plain ref objects; the parts prove the composed
 * host wiring.
 */
import { describe, expect, it, vi } from 'vitest'
import { setRef } from './refs'

describe('setRef', () => {
  it('writes the node into an object ref and clears on null', () => {
    const target = { current: null as object | null }
    const node = {}
    expect(setRef(target, node)).toBeUndefined()
    expect(target.current).toBe(node)
    setRef(target, null)
    expect(target.current).toBeNull()
  })

  it('passes the node to a function ref and returns its cleanup', () => {
    const seen: unknown[] = []
    const cleanup = vi.fn()
    const returned = setRef<object>((node) => {
      seen.push(node)
      return cleanup
    }, {})
    expect(seen).toHaveLength(1)
    expect(returned).toBe(cleanup)
  })

  it('ignores a missing ref', () => {
    expect(setRef<object>(undefined, {})).toBeUndefined()
  })
})

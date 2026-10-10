/** Ref-fanout proof for composeRefs: object refs, function-ref cleanups, gaps. */
import { describe, expect, it, vi } from 'vitest'
import { composeRefs } from './refs'

describe('composeRefs', () => {
  it('writes the node into every object ref and clears on null', () => {
    const first = { current: null as object | null }
    const second = { current: null as object | null }
    const node = {}
    const setNode = composeRefs<object>(first, second)
    setNode(node)
    expect(first.current).toBe(node)
    expect(second.current).toBe(node)
    setNode(null)
    expect(first.current).toBeNull()
    expect(second.current).toBeNull()
  })

  it('calls function refs and returns a cleanup running each teardown once', () => {
    const calls: unknown[] = []
    const firstCleanup = vi.fn()
    const secondCleanup = vi.fn()
    const setNode = composeRefs<object>(
      (node) => {
        calls.push(node)
        return firstCleanup
      },
      (node) => {
        calls.push(node)
        return secondCleanup
      }
    )
    const node = {}
    const cleanup = setNode(node)
    expect(calls).toEqual([node, node])
    expect(typeof cleanup).toBe('function')
    cleanup?.()
    expect(firstCleanup).toHaveBeenCalledTimes(1)
    expect(secondCleanup).toHaveBeenCalledTimes(1)
  })

  it('skips nullish refs and returns no cleanup without function teardowns', () => {
    const target = { current: null as object | null }
    const seen: unknown[] = []
    const setNode = composeRefs<object>(null, undefined, target, (node) => {
      seen.push(node)
    })
    const node = {}
    expect(setNode(node)).toBeUndefined()
    expect(target.current).toBe(node)
    expect(seen).toEqual([node])
  })
})

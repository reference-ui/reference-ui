import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { composeRefs } from './refs'

describe('composeRefs', () => {
  it('assigns object refs and calls callback refs with the node', () => {
    const objectRef = React.createRef<{ tag: string }>()
    const seen: Array<{ tag: string } | null> = []
    const node = { tag: 'button' }
    composeRefs(objectRef, (el: { tag: string } | null) => void seen.push(el), null, undefined)(node)
    expect(objectRef.current).toBe(node)
    expect(seen).toEqual([node])
  })

  it('collects callback cleanups into one returned cleanup', () => {
    const first = vi.fn()
    const second = vi.fn()
    const node = { tag: 'button' }
    const cleanup = composeRefs<{ tag: string }>(
      () => first,
      () => second
    )(node)
    expect(typeof cleanup).toBe('function')
    cleanup?.()
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })

  it('returns no cleanup when no callback ref hands one back', () => {
    const objectRef = React.createRef<{ tag: string }>()
    const node = { tag: 'button' }
    expect(composeRefs(objectRef, () => {})(node)).toBeUndefined()
    expect(composeRefs<{ tag: string }>(null, undefined)(node)).toBeUndefined()
  })
})

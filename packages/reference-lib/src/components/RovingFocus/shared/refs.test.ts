/** Isolated proof for shared/refs: slot ref chaining fans one mounted node
 * out to callback refs, object refs, or nothing at all — null-safe in every
 * position, including the unmount null pass. The full child/part/kernel fan
 * out is also covered by the component mount tests. */

import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { chainSlotRefs, setSlotRef } from './refs'

describe('setSlotRef', () => {
  it('writes callback and object refs and ignores the rest', () => {
    const node = {} as HTMLElement
    const cb = vi.fn()
    const obj = React.createRef<HTMLElement>()
    setSlotRef(cb, node)
    setSlotRef(obj, node)
    setSlotRef(null, node)
    setSlotRef(undefined, node)
    setSlotRef('ref', node)
    expect(cb).toHaveBeenCalledWith(node)
    expect(obj.current).toBe(node)
  })
})

describe('chainSlotRefs', () => {
  it('fans the node out to every ref in the chain', () => {
    const node = {} as HTMLElement
    const kernel = vi.fn()
    const child = React.createRef<HTMLElement>()
    const part = React.createRef<HTMLElement>()
    chainSlotRefs(kernel, child, part)(node)
    expect(kernel).toHaveBeenCalledWith(node)
    expect(child.current).toBe(node)
    expect(part.current).toBe(node)
  })

  it('passes null through on unmount', () => {
    const kernel = vi.fn()
    const child = React.createRef<HTMLElement | null>()
    child.current = {} as HTMLElement
    chainSlotRefs(kernel, child)(null)
    expect(kernel).toHaveBeenCalledWith(null)
    expect(child.current).toBeNull()
  })
})

/** Isolation proof for assignRef: function, object, and absent refs. */
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { assignRef } from './refs'

describe('assignRef', () => {
  it('calls function refs with the node and with null', () => {
    const fn = vi.fn()
    const node = {} as unknown as HTMLElement
    assignRef(fn, node)
    assignRef(fn, null)
    expect(fn).toHaveBeenNthCalledWith(1, node)
    expect(fn).toHaveBeenNthCalledWith(2, null)
  })

  it('writes object refs in place', () => {
    const ref = { current: null } as React.MutableRefObject<HTMLElement | null>
    const node = {} as unknown as HTMLElement
    assignRef(ref, node)
    expect(ref.current).toBe(node)
  })

  it('ignores null and undefined refs', () => {
    const node = {} as unknown as HTMLElement
    expect(() => assignRef(null, node)).not.toThrow()
    expect(() => assignRef(undefined, node)).not.toThrow()
  })
})

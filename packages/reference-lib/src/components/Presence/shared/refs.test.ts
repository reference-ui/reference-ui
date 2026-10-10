import { describe, expect, it, vi } from 'vitest'
import { setRef } from './refs'

/** Unit proof for `shared/refs`: one assignment per ref shape. */

describe('setRef', () => {
  it('assigns object refs and tolerates null', () => {
    const ref = { current: null as unknown }
    setRef(ref, 'node')
    expect(ref.current).toBe('node')
    setRef(ref, null)
    expect(ref.current).toBeNull()
  })

  it('calls callback refs and returns their cleanup', () => {
    const cleanup = () => {}
    const ref = vi.fn((_node: unknown) => cleanup)
    expect(setRef(ref, 'node')).toBe(cleanup)
    expect(ref).toHaveBeenCalledWith('node')
  })

  it('ignores undefined refs', () => {
    expect(setRef(undefined, 'node')).toBeUndefined()
  })
})

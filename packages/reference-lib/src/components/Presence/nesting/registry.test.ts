import { describe, expect, it, vi } from 'vitest'
import { createDescendantRegistry } from './registry'

/**
 * Unit proof for `nesting/registry`: pending-set semantics for nested exits
 * (PR-NEST-01/02/03) without a browser.
 */

describe('createDescendantRegistry', () => {
  it('tracks pending descendants until each settles', () => {
    const onSettled = vi.fn()
    const registry = createDescendantRegistry(onSettled)
    expect(registry.size).toBe(0)

    registry.register('a')
    registry.register('b')
    expect(registry.size).toBe(2)
    expect(onSettled).not.toHaveBeenCalled()

    registry.complete('a')
    expect(registry.size).toBe(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith('a')

    registry.unregister('b')
    expect(registry.size).toBe(0)
    expect(onSettled).toHaveBeenCalledTimes(2)
  })

  it('settles unconditionally so interrupted or removed exits release the parent', () => {
    const onSettled = vi.fn()
    const registry = createDescendantRegistry(onSettled)
    registry.unregister('never-registered')
    registry.complete('also-never-registered')
    expect(registry.size).toBe(0)
    expect(onSettled).toHaveBeenCalledTimes(2)
  })

  it('registers each descendant once', () => {
    const registry = createDescendantRegistry(() => {})
    registry.register('a')
    registry.register('a')
    expect(registry.size).toBe(1)
  })
})

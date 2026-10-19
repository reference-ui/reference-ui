// @vitest-environment happy-dom
/**
 * Lock-membership proof: container, shards, and outside nodes. Runs in
 * happy-dom against real nodes; containment checks every focus event
 * against it.
 */
import { describe, expect, it } from 'vitest'
import { isInsideLock } from './inside'

describe('isInsideLock', () => {
  it('accepts the container, its descendants, and shard descendants', () => {
    const container = document.createElement('section')
    const child = document.createElement('button')
    container.appendChild(child)
    const shard = document.createElement('div')
    const shardChild = document.createElement('button')
    shard.appendChild(shardChild)
    const outside = document.createElement('button')
    document.body.append(container, shard, outside)
    try {
      expect(isInsideLock(container, [shard], container)).toBe(true)
      expect(isInsideLock(container, [shard], child)).toBe(true)
      expect(isInsideLock(container, [shard], shard)).toBe(true)
      expect(isInsideLock(container, [shard], shardChild)).toBe(true)
      expect(isInsideLock(container, [shard], outside)).toBe(false)
      expect(isInsideLock(container, [], shardChild)).toBe(false)
      expect(isInsideLock(container, [shard], null)).toBe(false)
    } finally {
      document.body.removeChild(container)
      document.body.removeChild(shard)
      document.body.removeChild(outside)
    }
  })
})

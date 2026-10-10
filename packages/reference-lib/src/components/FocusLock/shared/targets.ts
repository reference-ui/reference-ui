/**
 * Resolving the caller's focus vocabulary into elements. resolveFocusTarget
 * collapses a FocusTarget or boolean into one element-or-null for initial
 * and restore moves, while resolveShardElements filters the shards prop down
 * to the connected elements that belong to this lock right now.
 */
import type * as React from 'react'
import type { FocusTarget } from '../types'

export function resolveFocusTarget(target?: FocusTarget | boolean | null): HTMLElement | null {
  if (!target || target === true || typeof target === 'boolean') {
    return null
  }
  if (typeof target === 'function') {
    return target()
  }
  if (typeof target === 'object' && 'current' in target) {
    return target.current
  }
  if (target instanceof HTMLElement) {
    return target
  }
  return null
}

export function resolveShardElements(
  shards?: Array<HTMLElement | React.RefObject<HTMLElement | null>>
): HTMLElement[] {
  if (!shards) return []
  const list: HTMLElement[] = []
  for (const shard of shards) {
    if (shard instanceof HTMLElement && shard.isConnected) {
      list.push(shard)
    } else if (
      shard &&
      typeof shard === 'object' &&
      'current' in shard &&
      shard.current instanceof HTMLElement &&
      shard.current.isConnected
    ) {
      list.push(shard.current)
    }
  }
  return list
}

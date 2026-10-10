/**
 * Lock membership: isInsideLock answers whether a node belongs to this
 * lock's working area — the authored container plus every resolved shard —
 * by delegating composed containment to Overlay's isNodeInside. Tab, reclaim,
 * and restore all consult it before deciding a move counts as an escape.
 */
import { isNodeInside } from '../../Overlay/shared/events'

export function isInsideLock(
  container: HTMLElement,
  shards: HTMLElement[],
  node: Node | null
): boolean {
  if (!node) return false
  if (isNodeInside(container, node)) return true
  return shards.some(shard => isNodeInside(shard, node))
}

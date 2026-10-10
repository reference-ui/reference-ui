/**
 * Catalog assembly: getTabbableCandidates merges one lock root with its
 * shards into the single deterministic list Tab walks. Collection runs per
 * root through composed traversal, duplicates collapse, named radios fold to
 * their checked member, and the survivors sort back into document order —
 * positive tabindex never reorders the lock.
 */
import { tabIndexValue } from './eligibility'
import { collectRadioState, includeRadio } from './radio'
import { collectComposedCandidates, documentOrder } from './traversal'

export function getTabbableCandidates(
  container: HTMLElement,
  shards: HTMLElement[] = []
): HTMLElement[] {
  const roots = [container, ...shards].filter(root => root && root.isConnected)
  const collected: HTMLElement[] = []
  for (const root of roots) {
    collected.push(...collectComposedCandidates(root))
  }

  const unique = Array.from(new Set(collected)).filter(el => {
    if (el === container && tabIndexValue(el) !== null && (tabIndexValue(el) as number) < 0) {
      return false
    }
    return true
  })

  const radioState = collectRadioState(unique)
  const eligible = unique.filter(el => includeRadio(el, radioState))
  eligible.sort(documentOrder)
  return eligible
}

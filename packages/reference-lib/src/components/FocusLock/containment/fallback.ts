/**
 * The reclaim landing: pickFallbackTarget names where containment returns
 * focus after an escape, a removal, or an invalidation. The most recent live
 * inside node wins, then its predecessor, then the first current candidate —
 * the candidate query stays behind a thunk so the common hit never pays for
 * a tree walk.
 */

export function pickFallbackTarget(args: {
  last: HTMLElement | null
  previous: HTMLElement | null
  container: HTMLElement
  listFirst: () => HTMLElement
  isUsable: (node: HTMLElement) => boolean
}): HTMLElement {
  const { last, previous, container, listFirst, isUsable } = args
  if (last && isUsable(last)) return last
  if (previous && isUsable(previous)) return previous
  return listFirst()
}

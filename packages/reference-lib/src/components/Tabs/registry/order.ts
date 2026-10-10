/**
 * Registry ordering: registry insertion order goes stale across
 * reorders, so enabled and full tab orders sort by live document
 * position instead. Detached entries drop out; unmeasured entries keep
 * relative order. Pure comparators over entry elements; unit-tested.
 */
export function isLiveElement(element: HTMLElement | null): boolean {
  return !element || element.isConnected
}

export function byDocumentPosition(
  a: { element: HTMLElement | null },
  b: { element: HTMLElement | null }
): number {
  const elA = a.element
  const elB = b.element
  if (!elA || !elB || elA === elB) return 0
  const pos = elA.compareDocumentPosition(elB)
  if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

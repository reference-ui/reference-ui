/**
 * Composed-order traversal: walking a lock root the way focus would travel
 * it. collectComposedCandidates gathers raw tabbables through open shadow
 * roots and assigned slots while treating iframes, closed roots, and
 * tabindex=-1 hosts as opaque, and documentOrder sorts the merged
 * main-plus-shard set back into deterministic document order.
 */
import { firstSummary, isElementTabbable, tabIndexValue } from './eligibility'

function walkComposed(node: Node, into: HTMLElement[]): void {
  if (node instanceof HTMLElement) {
    if (isElementTabbable(node)) into.push(node)

    if (node.tagName === 'IFRAME') return

    const hostTabIndex = tabIndexValue(node)
    if (node.shadowRoot && hostTabIndex !== null && hostTabIndex < 0) {
      return
    }

    if (node instanceof HTMLDetailsElement && !node.open) {
      const summary = firstSummary(node)
      if (summary) walkComposed(summary, into)
      return
    }

    const shadow = node.shadowRoot
    if (shadow) {
      if (shadow.mode === 'open') {
        for (const child of shadow.childNodes) walkComposed(child, into)
      }
      return
    }

    if (node instanceof HTMLSlotElement) {
      const assigned = node.assignedNodes({ flatten: true })
      if (assigned.length > 0) {
        for (const assignedNode of assigned) walkComposed(assignedNode, into)
        return
      }
    }
  } else if (node instanceof ShadowRoot) {
    for (const child of node.childNodes) walkComposed(child, into)
    return
  }

  for (const child of node.childNodes) walkComposed(child, into)
}

export function collectComposedCandidates(root: Node): HTMLElement[] {
  const into: HTMLElement[] = []
  walkComposed(root, into)
  return into
}

function hostInDocument(el: HTMLElement): HTMLElement {
  let current: Node = el
  while (current) {
    const root = current.getRootNode()
    if (root instanceof ShadowRoot) {
      current = root.host
      continue
    }
    return current instanceof HTMLElement ? current : el
  }
  return el
}

export function documentOrder(a: HTMLElement, b: HTMLElement): number {
  if (a === b) return 0
  const aHost = hostInDocument(a)
  const bHost = hostInDocument(b)
  if (aHost === bHost) return 0
  const position = aHost.compareDocumentPosition(bHost)
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

/**
 * Reading and writing focus across shadow boundaries. deepActiveElement
 * follows shadowRoot.activeElement down to the truly focused element, and
 * safeFocus moves focus only when the node is connected and not already
 * active, so reclaim and restore never fight the browser or spin on dead nodes.
 */

export function deepActiveElement(doc: Document): HTMLElement | null {
  let active: Element | null = doc.activeElement
  while (active instanceof HTMLElement && active.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active instanceof HTMLElement ? active : null
}

export function safeFocus(node: HTMLElement | null) {
  if (!node || !node.isConnected) return
  if (deepActiveElement(node.ownerDocument) === node) return
  node.focus({ preventScroll: true })
}

/**
 * Owning-root reads for shadow-mounted trees: a trigger or menu living
 * in a shadow root retargets document-level lookups, so id and focus
 * discovery run against the node's own root. Light-DOM trees resolve
 * to the document; shadow trees to their ShadowRoot. Unit-tested.
 */
// Owning-root reads for ShadowRoot-mounted trees. A trigger or menu living
// in a shadow root retargets document-level lookups (event.target becomes
// the host, document.activeElement never enters), so id and focus discovery
// run against the node's own root.
export function owningScope(node: HTMLElement | null): Document | ShadowRoot | null {
  if (typeof document === 'undefined') return null
  const root = node?.getRootNode?.() ?? null
  if (root !== null && typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) {
    return root
  }
  return document
}

export function activeElementIn(node: HTMLElement | null): Element | null {
  const scope = owningScope(node)
  if (typeof ShadowRoot !== 'undefined' && scope instanceof ShadowRoot) return scope.activeElement
  return scope?.activeElement ?? null
}

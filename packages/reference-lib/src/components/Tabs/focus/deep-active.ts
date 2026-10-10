/**
 * Shadow-aware focus lookup: document.activeElement stops at the shadow
 * host, so the search starts from a scope element's own root and
 * descends through open shadow roots. In light DOM this is exactly
 * document.activeElement; in shadow trees it finds the true holder.
 */
// Shadow-aware focus lookup (TB-ENV-03): document.activeElement stops at
// the shadow host, so start from the list's own root and descend through
// open shadow roots. In light DOM this is document.activeElement.
export function getDeepActiveElement(scope: Element): Element | null {
  let active: Element | null = (scope.getRootNode() as Document | ShadowRoot)
    .activeElement
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active
}


const refCountMap = new WeakMap<Element, number>()

export function ariaHideOutside(overlayEl: HTMLElement) {
  const siblingsToHide: Element[] = []
  
  // A simple implementation that walks up to the body and hides siblings
  let current: Element | null = overlayEl
  while (current && current !== document.body) {
    const parent: Element | null = current.parentElement
    if (!parent) break
    
    for (let i = 0; i < parent.children.length; i++) {
      const sibling = parent.children[i]
      if (sibling === current) continue
      if (sibling.hasAttribute('data-reference-overlay-ignore')) continue
      if (sibling.hasAttribute('data-reference-overlay-backdrop')) continue
      if (sibling.hasAttribute('data-reference-overlay-content')) continue
      if (sibling.hasAttribute('data-reference-portal-container')) continue
      if (sibling.hasAttribute('aria-live')) continue
      if (sibling.hasAttribute('data-reference-toast-host')) continue
      if (sibling.querySelector('[data-reference-toast-host]')) continue

      const count = refCountMap.get(sibling) || 0
      refCountMap.set(sibling, count + 1)
      if (count === 0) {
        if (!sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '')
          sibling.setAttribute('data-overlay-managed-inert', '')
        }
      }
      siblingsToHide.push(sibling)
    }
    current = parent
  }

  return () => {
    for (const sibling of siblingsToHide) {
      const count = refCountMap.get(sibling) || 0
      if (count <= 1) {
        refCountMap.delete(sibling)
        if (sibling.hasAttribute('data-overlay-managed-inert')) {
          sibling.removeAttribute('inert')
          sibling.removeAttribute('data-overlay-managed-inert')
        }
      } else {
        refCountMap.set(sibling, count - 1)
      }
    }
  }
}

const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function isVisible(el: HTMLElement): boolean {
  if (el.closest('[inert], [hidden], [aria-hidden="true"]')) return false
  const style = el.ownerDocument.defaultView?.getComputedStyle(el)
  return style?.display !== 'none' && style?.visibility !== 'hidden'
}

export function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(isVisible)
}

export function nextAfter(el: HTMLElement, exclude?: HTMLElement | null): HTMLElement | null {
  const all = Array.from(el.ownerDocument.querySelectorAll<HTMLElement>(TABBABLE)).filter(cand => {
    if (exclude && (cand === exclude || exclude.contains(cand))) return false
    return isVisible(cand)
  })
  const idx = all.indexOf(el)
  return all[idx + 1] ?? null
}

/**
 * Header scope: which buttons an accordion's arrow traversal may land on. A
 * node is content-bound when a disclosure panel (a `div` with `data-state`
 * and `id`) sits between it and the root without crossing another accordion
 * root, and collectHeaderTriggers keeps only the root's own expanded-state
 * buttons that are not content-bound (AC-KEY-07).
 */
export function isInsideContentOf(activeEl: HTMLElement, rootEl: HTMLElement): boolean {
  let cur: HTMLElement | null = activeEl.parentElement
  while (cur && cur !== rootEl) {
    if (cur.hasAttribute('data-reference-accordion')) {
      return false
    }
    if (cur.tagName === 'DIV' && cur.hasAttribute('data-state') && cur.hasAttribute('id')) {
      return true
    }
    cur = cur.parentElement
  }
  return false
}

export function collectHeaderTriggers(rootEl: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    rootEl.querySelectorAll<HTMLButtonElement>('button[aria-expanded]')
  ).filter((btn) => {
    if (btn.closest('[data-reference-accordion]') !== rootEl) return false
    if (isInsideContentOf(btn, rootEl)) return false
    return true
  })
}

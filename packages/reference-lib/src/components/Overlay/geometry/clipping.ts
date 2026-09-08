export function rectHidden(rect: DOMRect, vw: number, vh: number, pad: number): boolean {
  return (
    rect.bottom < pad ||
    rect.top > vh - pad ||
    rect.right < pad ||
    rect.left > vw - pad
  )
}

export function isFullyClipped(rect: DOMRect, clip: DOMRect, pad: number): boolean {
  return (
    rect.bottom <= clip.top + pad ||
    rect.top >= clip.bottom - pad ||
    rect.right <= clip.left + pad ||
    rect.left >= clip.right - pad
  )
}

export function getOverflowAncestors(node: Node): Array<Element | Window> {
  const list: Array<Element | Window> = []
  let current: Node | null = node.parentNode

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const element = current as Element
    const style = element.ownerDocument.defaultView?.getComputedStyle(element)
    if (style) {
      const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`
      if (/auto|scroll|overlay|hidden/.test(overflow)) list.push(element)
    }
    current = current.parentNode
  }

  const win = node instanceof Element ? node.ownerDocument.defaultView : window
  if (win) list.push(win)
  return list
}

/** True when `rect` is fully outside the viewport or a clipping ancestor of `source`. */
export function hiddenByClipping(
  rect: DOMRect,
  source: Element | null,
  vw: number,
  vh: number,
  pad: number
): boolean {
  if (rectHidden(rect, vw, vh, pad)) return true
  if (!source) return false
  for (const anc of getOverflowAncestors(source)) {
    if (!(anc instanceof Element)) continue
    if (isFullyClipped(rect, anc.getBoundingClientRect(), pad)) return true
  }
  return false
}

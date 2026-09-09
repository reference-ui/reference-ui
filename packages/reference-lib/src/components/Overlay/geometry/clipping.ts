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

function parentNode(node: Node): Node | null {
  if (node.parentNode) return node.parentNode
  const root = typeof node.getRootNode === 'function' ? node.getRootNode() : null
  return root instanceof ShadowRoot ? root.host : null
}

export function getOverflowAncestors(node: Node): Array<Element | Window> {
  const list: Array<Element | Window> = []
  let current: Node | null = parentNode(node)

  while (current) {
    if (current instanceof ShadowRoot) {
      current = current.host
      continue
    }
    if (current.nodeType !== Node.ELEMENT_NODE) break
    const element = current as Element
    const style = element.ownerDocument.defaultView?.getComputedStyle(element)
    if (style) {
      const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`
      if (/auto|scroll|overlay|hidden/.test(overflow)) list.push(element)
    }
    current = parentNode(element)
  }

  const win =
    node instanceof Element
      ? node.ownerDocument.defaultView
      : typeof window !== 'undefined'
        ? window
        : null
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

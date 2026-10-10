/** Searchable-label derivation for the RovingFocus kernel (RF-TYPE-09,
 * RF-TYPE-12). `getItemSearchText` resolves each item's match string from the
 * highest-priority live source — explicit `textValue`, then child
 * `aria-label`, then rendered text with aria-hidden subtrees excluded and
 * whitespace collapsed — so label changes rerender into search immediately. */

import type { ItemEntry } from '../types'
import { resolveEntryNode } from '../shared/nodes'

function extractVisibleText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ''
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement
    if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('hidden')) {
      return ''
    }
    let text = ''
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i]
      if (child) text += extractVisibleText(child)
    }
    return text
  }
  return ''
}

export function getItemSearchText(entry: ItemEntry): string {
  if (entry.textValue != null && entry.textValue !== '') {
    return entry.textValue.trim()
  }
  const el = resolveEntryNode(entry)
  if (!el) return ''
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel != null && ariaLabel !== '') {
    return ariaLabel.trim()
  }
  const text = extractVisibleText(el)
  return text.replace(/\s+/g, ' ').trim()
}

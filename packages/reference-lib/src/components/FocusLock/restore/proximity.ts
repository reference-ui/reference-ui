/**
 * Sibling-and-ancestor proximity: findFocusableProximity names the live
 * replacement when a restore origin is gone. It walks right siblings first
 * (descending into their subtrees), then left, then up through ancestors,
 * returning the nearest connected focusable node or null when nothing
 * survives — the focus-lock return-focus algorithm under our catalog.
 */
import { getTabbableCandidates } from '../catalog/candidates'
import { isElementFocusable, isElementTabbable } from '../catalog/eligibility'

export function findFocusableProximity(
  node: HTMLElement | null,
  parent: HTMLElement | null,
  next: Node | null,
  prev: Node | null
): HTMLElement | null {
  if (node && isElementFocusable(node) && node.isConnected) {
    return node
  }

  const liveParent =
    (node && node.isConnected ? node.parentElement : null) || parent
  const liveNext =
    (node && node.isConnected ? node.nextElementSibling : null) ||
    (next instanceof HTMLElement ? next : null)
  const livePrev =
    (node && node.isConnected ? node.previousElementSibling : null) ||
    (prev instanceof HTMLElement ? prev : null)

  let curr: Element | null =
    liveNext instanceof Element ? liveNext : null
  while (curr) {
    if (curr instanceof HTMLElement && curr.isConnected) {
      if (isElementFocusable(curr) && isElementTabbable(curr)) return curr
      const desc = getTabbableCandidates(curr)[0]
      if (desc) return desc
      if (isElementFocusable(curr)) return curr
    }
    curr = curr.nextElementSibling
  }

  curr = livePrev instanceof Element ? livePrev : null
  while (curr) {
    if (curr instanceof HTMLElement && curr.isConnected) {
      const focusables = getTabbableCandidates(curr)
      if (focusables.length > 0) return focusables[focusables.length - 1]
      if (isElementFocusable(curr)) return curr
    }
    curr = curr.previousElementSibling
  }

  curr = liveParent
  while (curr) {
    if (curr instanceof HTMLElement && curr.isConnected && isElementFocusable(curr)) {
      return curr
    }
    curr = curr.parentElement
  }

  return null
}

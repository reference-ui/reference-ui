import * as React from 'react'
import { isNodeInside } from '../shared/events'
import { overlayStackStore, layerDocument } from '../stack'

const refCount = new WeakMap<Element, number>()

function isExempt(el: Element): boolean {
  if (el.hasAttribute('data-reference-overlay-ignore')) return true
  if (el.hasAttribute('data-reference-overlay-backdrop')) return true
  if (el.hasAttribute('data-reference-overlay-content')) return true
  if (el.hasAttribute('data-reference-portal-container')) return true
  if (el.hasAttribute('aria-live')) return true
  if (el.hasAttribute('data-reference-toast-host')) return true
  return false
}

function parentOf(el: Element): Element | null {
  if (el.parentElement) return el.parentElement
  const root = el.getRootNode()
  return root instanceof ShadowRoot ? root.host : null
}

function overlayKeep(doc: Document): Element[] {
  const keep: Element[] = []
  for (const layer of overlayStackStore.getState().layers) {
    if (layerDocument(layer) && layerDocument(layer) !== doc) continue
    if (layer.node) keep.push(layer.node)
    if (layer.backdrop) keep.push(layer.backdrop)
  }
  return keep
}

function shouldSkip(el: Element, keep: Element[]): boolean {
  if (isExempt(el)) return true
  return keep.some(k => el === k || el.contains(k) || isNodeInside(el, k))
}

function isAuthoredHiddenBoundary(el: Element): boolean {
  if (el.getAttribute('aria-hidden') === 'true') return true
  return el.hasAttribute('inert') && !el.hasAttribute('data-overlay-managed-inert')
}

function isInsideOpaqueBackground(el: Element): boolean {
  let walk = parentOf(el)
  while (walk) {
    if (isAuthoredHiddenBoundary(walk)) return true
    walk = parentOf(walk)
  }
  return false
}

function observeHideRoots(overlayEl: HTMLElement, observer: MutationObserver) {
  const doc = overlayEl.ownerDocument
  observer.observe(doc.body, { childList: true, subtree: true })
  let current: Element | null = overlayEl
  while (current) {
    const root = current.getRootNode()
    if (!(root instanceof ShadowRoot)) break
    observer.observe(root, { childList: true, subtree: true })
    current = root.host
  }
}

function hide(el: Element) {
  const count = refCount.get(el) ?? 0
  refCount.set(el, count + 1)
  if (count === 0 && !el.hasAttribute('inert')) {
    el.setAttribute('inert', '')
    el.setAttribute('data-overlay-managed-inert', '')
  }
}

function show(el: Element) {
  const count = refCount.get(el) ?? 0
  if (count <= 1) {
    refCount.delete(el)
    if (el.hasAttribute('data-overlay-managed-inert')) {
      el.removeAttribute('inert')
      el.removeAttribute('data-overlay-managed-inert')
    }
  } else {
    refCount.set(el, count - 1)
  }
}

function hideExcluding(root: Element, keep: Element[], hidden: Element[]) {
  for (const child of Array.from(root.children)) {
    if (isAuthoredHiddenBoundary(child)) continue
    if (isExempt(child)) continue
    if (keep.some(k => child === k || child.contains(k) || isNodeInside(child, k))) {
      hideExcluding(child, keep, hidden)
      continue
    }
    if (child.querySelector?.('[data-reference-toast-host], [aria-live]')) {
      hideExcluding(child, keep, hidden)
      continue
    }
    hide(child)
    hidden.push(child)
  }
}

export function hideOutside(overlayEl: HTMLElement): () => void {
  const doc = overlayEl.ownerDocument
  const hidden: Element[] = []
  const keep = overlayKeep(doc)

  let current: Node | null = overlayEl
  while (current && current !== doc.body && current !== doc.documentElement) {
    const parent: Node | null = current.parentNode
    if (!parent) break

    const siblings =
      parent instanceof ShadowRoot || parent instanceof Element
        ? Array.from(parent.children)
        : []

    for (const sibling of siblings) {
      if (sibling === current) continue
      if (!(sibling instanceof Element)) continue
      if (isAuthoredHiddenBoundary(sibling)) continue
      if (isExempt(sibling)) continue
      if (keep.some(k => sibling === k || sibling.contains(k) || isNodeInside(sibling, k))) {
        hideExcluding(sibling, keep, hidden)
        continue
      }
      if (sibling.querySelector?.('[data-reference-toast-host], [aria-live]')) {
        hideExcluding(sibling, keep, hidden)
        continue
      }
      hide(sibling)
      hidden.push(sibling)
    }

    current =
      parent instanceof ShadowRoot
        ? parent.host
        : parent instanceof Element
          ? parent
          : null
  }

  const observer = new MutationObserver(mutations => {
    const liveKeep = overlayKeep(doc)
    const isKept = (node: Element) =>
      isNodeInside(overlayEl, node) ||
      overlayEl === node ||
      liveKeep.some(k => k === node || isNodeInside(k, node) || node.contains(k))

    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (!(node instanceof Element)) continue
        if (isAuthoredHiddenBoundary(node)) continue

        // OV-INERT-04: a node reparented into Content must drop stale inert.
        if (isKept(node)) {
          const idx = hidden.indexOf(node)
          if (idx !== -1) {
            show(node)
            hidden.splice(idx, 1)
          }
          continue
        }

        // OV-INERT-10: already-hidden ancestors own the subtree. Drop duplicate
        // Overlay inert so teardown only restores attributes we added.
        if (isInsideOpaqueBackground(node)) {
          const idx = hidden.indexOf(node)
          if (idx !== -1) {
            show(node)
            hidden.splice(idx, 1)
          }
          continue
        }

        if (shouldSkip(node, liveKeep)) continue
        const parent = parentOf(node)
        if (!parent) continue
        let walk: Element | null = parent
        let adjacent = false
        while (walk) {
          if (walk === overlayEl) break
          if (walk === doc.body) {
            adjacent = true
            break
          }
          walk = parentOf(walk)
        }
        if (!adjacent || hidden.includes(node)) continue
        hide(node)
        hidden.push(node)
      }
    }
  })

  observeHideRoots(overlayEl, observer)

  return () => {
    observer.disconnect()
    for (const el of hidden) show(el)
  }
}

export function useHideOutside(node: HTMLElement | null, enabled: boolean) {
  React.useEffect(() => {
    if (!enabled || !node) return
    return hideOutside(node)
  }, [enabled, node])
}

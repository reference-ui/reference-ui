import * as React from 'react'
import { overlayStackStore, layerDocument } from '../stack'
import { eventPath, isNodeInside } from '../shared/events'

type Restore = () => void

type Lock = {
  count: number
  restore: Restore
}

const locks = new WeakMap<Document, Lock>()

function isIOS(doc?: Document): boolean {
  if (doc?.documentElement?.hasAttribute('data-test-ios') || (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-test-ios'))) {
    return true
  }
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return (
    /iP(ad|hone|od)/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    (typeof window !== 'undefined' &&
      window.matchMedia?.('(display-mode: standalone)').matches) === true
  )
}

function scrollbarSize(doc: Document): number {
  return doc.defaultView
    ? doc.defaultView.innerWidth - doc.documentElement.clientWidth
    : 0
}

function isRtl(doc: Document): boolean {
  return doc.defaultView?.getComputedStyle(doc.documentElement).direction === 'rtl'
}

function overflowCanScroll(el: HTMLElement): boolean {
  const style = el.ownerDocument.defaultView?.getComputedStyle(el)
  if (!style) return false
  const y = style.overflowY + style.overflow
  const x = style.overflowX + style.overflow
  return /auto|scroll|overlay/.test(y) || /auto|scroll|overlay/.test(x)
}

function nearestScrollable(path: EventTarget[]): HTMLElement | null {
  for (const node of path) {
    if (node instanceof HTMLElement && overflowCanScroll(node)) return node
  }
  return null
}

function canConsume(el: HTMLElement, dx: number, dy: number): boolean {
  if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true
  if (dy < 0 && el.scrollTop > 0) return true
  if (dx > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true
  if (dx < 0 && el.scrollLeft > 0) return true
  return false
}

function overlayRoots(doc: Document): HTMLElement[] {
  const out: HTMLElement[] = []
  for (const layer of overlayStackStore.getState().layers) {
    if (layerDocument(layer) !== doc) continue
    if (layer.node) out.push(layer.node)
  }
  return out
}

function insideOverlay(path: EventTarget[], doc: Document): boolean {
  const roots = overlayRoots(doc)
  for (const node of path) {
    if (!(node instanceof Node)) continue
    if (roots.some(root => isNodeInside(root, node))) return true
  }
  return false
}

function preventIfDocumentScroll(
  event: WheelEvent | TouchEvent,
  dx: number,
  dy: number,
  doc: Document
) {
  const path = eventPath(event)
  if (!insideOverlay(path, doc)) {
    event.preventDefault()
    return
  }
  const scrollable = nearestScrollable(path)
  if (scrollable && canConsume(scrollable, dx, dy)) return
  event.preventDefault()
}

function applyLock(doc: Document, positionFixed: boolean): Restore {
  const html = doc.documentElement
  const body = doc.body
  const win = doc.defaultView!
  const scrollX = win.scrollX
  const scrollY = win.scrollY
  const gap = scrollbarSize(doc)
  const rtl = isRtl(doc)
  const padProp = rtl ? 'paddingLeft' : 'paddingRight'
  const padPropKebab = rtl ? 'padding-left' : 'padding-right'
  const prevPadPriority =
    body.style.getPropertyPriority(padPropKebab) || body.style.getPropertyPriority(padProp)

  const prev = {
    htmlOverflow: html.style.overflow,
    htmlOverscroll: html.style.overscrollBehavior,
    bodyOverflow: body.style.overflow,
    bodyOverscroll: body.style.overscrollBehavior,
    bodyPad: body.style[padProp],
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
  }

  html.style.overflow = 'hidden'
  html.style.overscrollBehavior = 'none'
  body.style.overflow = 'hidden'
  body.style.overscrollBehavior = 'none'
  if (gap > 0) {
    const current = parseFloat(win.getComputedStyle(body)[padProp]) || 0
    body.style[padProp] = `${current + gap}px`
  }
  win.scrollTo(scrollX, scrollY)

  const useFixed = positionFixed && isIOS(doc) && !isStandalone()
  if (useFixed) {
    // iOS Safari: `overflow: hidden` does not stop rubber-band document
    // scroll. Pin body to `position: fixed` at the current offset instead.
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
  }

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return
    preventIfDocumentScroll(event, event.deltaX, event.deltaY, doc)
  }

  let lastTouch: { x: number; y: number } | null = null
  const onTouchStart = (event: TouchEvent) => {
    const t = event.touches[0]
    lastTouch = t ? { x: t.clientX, y: t.clientY } : null
  }
  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 1) return
    const t = event.touches[0]
    if (!t || !lastTouch) return
    preventIfDocumentScroll(event, lastTouch.x - t.clientX, lastTouch.y - t.clientY, doc)
    lastTouch = { x: t.clientX, y: t.clientY }
  }

  win.addEventListener('wheel', onWheel, { passive: false })
  win.addEventListener('touchstart', onTouchStart, { passive: true })
  win.addEventListener('touchmove', onTouchMove, { passive: false })

  const vv = win.visualViewport
  const onViewport = () => {
    if (useFixed) return
    if (win.scrollY !== scrollY || win.scrollX !== scrollX) {
      win.scrollTo(scrollX, scrollY)
    }
  }
  vv?.addEventListener('scroll', onViewport)
  vv?.addEventListener('resize', onViewport)

  return () => {
    html.style.overflow = prev.htmlOverflow
    html.style.overscrollBehavior = prev.htmlOverscroll
    body.style.overflow = prev.bodyOverflow
    body.style.overscrollBehavior = prev.bodyOverscroll
    if (prev.bodyPad) {
      body.style.setProperty(padPropKebab, prev.bodyPad, prevPadPriority)
    } else {
      body.style.removeProperty(padPropKebab)
      body.style.removeProperty(padProp)
    }
    body.style.position = prev.bodyPosition
    body.style.top = prev.bodyTop
    body.style.left = prev.bodyLeft
    body.style.right = prev.bodyRight
    body.style.width = prev.bodyWidth
    win.removeEventListener('wheel', onWheel)
    win.removeEventListener('touchstart', onTouchStart)
    win.removeEventListener('touchmove', onTouchMove)
    vv?.removeEventListener('scroll', onViewport)
    vv?.removeEventListener('resize', onViewport)
    if (useFixed) win.scrollTo(scrollX, scrollY)
  }
}

export function acquireScrollLock(doc: Document, positionFixed: boolean): Restore {
  const existing = locks.get(doc)
  if (existing) {
    existing.count += 1
    return () => {
      existing.count -= 1
      if (existing.count <= 0) {
        existing.restore()
        locks.delete(doc)
      }
    }
  }
  const lock: Lock = { count: 1, restore: applyLock(doc, positionFixed) }
  locks.set(doc, lock)
  return () => {
    lock.count -= 1
    if (lock.count <= 0) {
      lock.restore()
      locks.delete(doc)
    }
  }
}

export function usePreventScroll(
  enabled: boolean,
  positionFixed = false,
  doc?: Document | null
) {
  React.useEffect(() => {
    if (!enabled) return
    const target = doc ?? (typeof document !== 'undefined' ? document : null)
    if (!target) return
    return acquireScrollLock(target, positionFixed)
  }, [enabled, positionFixed, doc])
}

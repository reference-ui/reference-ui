import type { OverlayEdge } from '../types'

const INSET = ['top', 'right', 'bottom', 'left'] as const

export function bindEdge(el: HTMLElement, edge: OverlayEdge, offset: number) {
  el.style.position = 'fixed'
  el.style.top = ''
  el.style.left = ''
  el.style.right = ''
  el.style.bottom = ''
  el.setAttribute('data-edge', edge)

  const gap = `${offset}px`
  const win = el.ownerDocument.defaultView
  const vw = win?.innerWidth ?? 0
  const vh = win?.innerHeight ?? 0

  switch (edge) {
    case 'bottom':
      el.style.bottom = gap
      el.style.left = '0'
      el.style.right = '0'
      el.style.setProperty('--reference-overlay-available-width', `${vw}px`)
      break
    case 'top':
      el.style.top = gap
      el.style.left = '0'
      el.style.right = '0'
      el.style.setProperty('--reference-overlay-available-width', `${vw}px`)
      break
    case 'left':
      el.style.left = gap
      el.style.top = '0'
      el.style.bottom = '0'
      el.style.setProperty('--reference-overlay-available-height', `${vh}px`)
      break
    case 'right':
      el.style.right = gap
      el.style.top = '0'
      el.style.bottom = '0'
      el.style.setProperty('--reference-overlay-available-height', `${vh}px`)
      break
  }
}

export function publishEdgeStack(el: HTMLElement, index: number, count: number) {
  el.style.setProperty('--reference-overlay-index', String(index))
  el.style.setProperty('--reference-overlay-count', String(count))
}

export function clearGeometry(el: HTMLElement) {
  for (const side of INSET) el.style[side] = ''
  el.style.position = ''
  el.removeAttribute('data-edge')
  el.removeAttribute('data-anchor-hidden')
  el.removeAttribute('data-escaped')
  el.style.removeProperty('--reference-overlay-available-width')
  el.style.removeProperty('--reference-overlay-available-height')
  el.style.removeProperty('--reference-overlay-anchor-width')
  el.style.removeProperty('--reference-overlay-anchor-height')
  el.style.removeProperty('--reference-overlay-transform-origin')
  el.style.removeProperty('--reference-overlay-index')
  el.style.removeProperty('--reference-overlay-count')
}

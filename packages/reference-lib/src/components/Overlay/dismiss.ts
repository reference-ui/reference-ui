import {
  overlayStackStore,
  getTopLiveLayer,
  getLayerHandlers,
  isRecentlyRemoved,
  layerDocument,
  type Layer,
} from './stack'
import { closestFromEvent, isEventInside, isPrimaryPointer, markEventConsumed, isEventConsumed } from './events'

type DocEntry = {
  escape: (event: KeyboardEvent) => void
  pointerDown: (event: PointerEvent) => void
  pointerMove: (event: PointerEvent) => void
  click: (event: MouseEvent) => void
  pointerCancel: (event: Event) => void
}

const bound = new WeakMap<Document, DocEntry>()
const pendingByDoc = new WeakMap<Document, { layerId: string; pointerId: number }>()
const attachTimers = new WeakMap<Document, number>()

function ownerDoc(event: Event): Document {
  const target = event.target
  if (target instanceof Node) return target.ownerDocument ?? document
  return document
}

function fieldFor(el: Element | null): Element | null {
  return el?.closest('[data-reference-field]') ?? null
}

/** Content, portalled descendants, trigger, and the trigger's Field bezel are inside. */
export function isInsideLayer(layer: Layer, event: Event): boolean {
  if (isEventInside(layer.node, event)) return true
  if (isEventInside(layer.trigger, event)) return true
  if (closestFromEvent(event, '[data-reference-overlay-ignore]')) return true

  const triggerField = fieldFor(layer.trigger)
  if (triggerField && isEventInside(triggerField, event)) return true

  const { layers } = overlayStackStore.getState()
  for (const other of layers) {
    if (other.id === layer.id) continue
    let walk: Layer | undefined = other
    while (walk?.parentId) {
      if (walk.parentId === layer.id) {
        if (isEventInside(other.node, event) || isEventInside(other.backdrop, event)) {
          return true
        }
        break
      }
      walk = layers.find(l => l.id === walk!.parentId)
    }
  }
  return false
}

function insideOwnBackdrop(layer: Layer, event: Event): boolean {
  return Boolean(layer.backdrop && isEventInside(layer.backdrop, event))
}

function requestOutside(layer: Layer, event: PointerEvent) {
  markEventConsumed(event)
  const h = getLayerHandlers(layer.id)
  h?.onOutsidePress?.(event)
  h?.onInteractOutside?.(event)
  if (!event.defaultPrevented) (h?.dismiss ?? layer.dismiss)()
}

function onEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  const doc = ownerDoc(event)
  const top = getTopLiveLayer(overlayStackStore.getState().layers, doc)
  if (!top) return

  const target = event.target
  if (target instanceof Element) {
    try {
      if (target.closest(':popover-open')) return
    } catch {
      // :popover-open unsupported
    }
  }

  const h = getLayerHandlers(top.id)
  h?.onEscape?.(event)
  if (!event.defaultPrevented) {
    event.preventDefault()
    ;(h?.dismiss ?? top.dismiss)()
  }
}

function onPointerDown(event: PointerEvent) {
  if (!isPrimaryPointer(event) || isEventConsumed(event)) return
  const doc = ownerDoc(event)
  const top = getTopLiveLayer(overlayStackStore.getState().layers, doc)
  if (!top || isRecentlyRemoved(top.id) || !top.node) return

  // OV-OUT-04: Ignore same-tick opening pointerdown
  if (top.openedAt && event.timeStamp <= top.openedAt) {
    return
  }

  // Backdrop is this layer's dismiss surface; the part handles it.
  if (insideOwnBackdrop(top, event)) {
    // OV-OUT-06: Touch on backdrop defers until click
    if (event.pointerType === 'touch') {
      pendingByDoc.set(doc, { layerId: top.id, pointerId: event.pointerId })
    }
    return
  }
  if (isInsideLayer(top, event)) {
    pendingByDoc.delete(doc)
    return
  }

  if (top.isolation.inert) {
    pendingByDoc.set(doc, { layerId: top.id, pointerId: event.pointerId })
    return
  }

  requestOutside(top, event)
}

function onPointerMove(event: PointerEvent) {
  const doc = ownerDoc(event)
  const pending = pendingByDoc.get(doc)
  if (!pending || pending.pointerId !== event.pointerId) return
  const layer = overlayStackStore.getState().layers.find(l => l.id === pending.layerId)
  if (!layer || isInsideLayer(layer, event)) pendingByDoc.delete(doc)
}

function onClick(event: MouseEvent) {
  if (isEventConsumed(event)) return
  const doc = ownerDoc(event)
  const pending = pendingByDoc.get(doc)
  if (!pending) return
  pendingByDoc.delete(doc)

  const top = getTopLiveLayer(overlayStackStore.getState().layers, doc)
  if (!top || top.id !== pending.layerId || isRecentlyRemoved(top.id)) return
  if (isInsideLayer(top, event)) return

  requestOutside(top, event as unknown as PointerEvent)
}

function onPointerCancel(event: Event) {
  pendingByDoc.delete(ownerDoc(event))
}

function bind(doc: Document) {
  if (bound.has(doc)) return
  const entry: DocEntry = {
    escape: onEscape,
    pointerDown: onPointerDown,
    pointerMove: onPointerMove,
    click: onClick,
    pointerCancel: onPointerCancel,
  }
  doc.addEventListener('keydown', entry.escape)
  doc.addEventListener('pointerdown', entry.pointerDown)
  doc.addEventListener('pointermove', entry.pointerMove)
  doc.addEventListener('click', entry.click, true)
  doc.addEventListener('pointercancel', entry.pointerCancel)
  bound.set(doc, entry)
}

function unbind(doc: Document) {
  const entry = bound.get(doc)
  if (!entry) return
  doc.removeEventListener('keydown', entry.escape)
  doc.removeEventListener('pointerdown', entry.pointerDown)
  doc.removeEventListener('pointermove', entry.pointerMove)
  doc.removeEventListener('click', entry.click, true)
  doc.removeEventListener('pointercancel', entry.pointerCancel)
  bound.delete(doc)
  pendingByDoc.delete(doc)
}

function openDocs(): Set<Document> {
  const docs = new Set<Document>()
  for (const layer of overlayStackStore.getState().layers) {
    if (!layer.open) continue
    const doc = layerDocument(layer)
    if (doc) docs.add(doc)
  }
  return docs
}

export function syncDismissListeners() {
  if (typeof document === 'undefined') return

  const needed = openDocs()
  const known = new Set<Document>(needed)
  if (typeof document !== 'undefined') known.add(document)

  for (const doc of seenDocs()) {
    known.add(doc)
  }

  for (const doc of known) {
    if (needed.has(doc)) {
      if (bound.has(doc) || attachTimers.has(doc)) continue
      const timer = window.setTimeout(() => {
        attachTimers.delete(doc)
        if (openDocs().has(doc)) bind(doc)
      }, 0)
      attachTimers.set(doc, timer)
    } else {
      const prev = attachTimers.get(doc)
      if (prev) {
        clearTimeout(prev)
        attachTimers.delete(doc)
      }
      unbind(doc)
    }
  }
}

function seenDocs(): Document[] {
  const out: Document[] = []
  for (const layer of overlayStackStore.getState().layers) {
    const doc = layerDocument(layer)
    if (doc) out.push(doc)
  }
  return out
}

import { setStackChangeListener } from './stack'

setStackChangeListener(syncDismissListeners)

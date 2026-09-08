import { overlayStackStore, type Layer } from '../stack'
import { closestFromEvent, isEventInside } from '../shared/events'

function fieldFor(el: Element | null): Element | null {
  return el?.closest('[data-reference-field]') ?? null
}

function isDescendantLayer(other: Layer, ancestorId: string, layers: Layer[]): boolean {
  let walk: Layer | undefined = other
  while (walk?.parentId) {
    if (walk.parentId === ancestorId) return true
    walk = layers.find(l => l.id === walk!.parentId)
  }
  return false
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
    if (!isDescendantLayer(other, layer.id, layers)) continue
    if (isEventInside(other.node, event) || isEventInside(other.backdrop, event)) {
      return true
    }
  }
  return false
}

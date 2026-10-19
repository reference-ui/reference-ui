/**
 * Per-layer callback registry: dismiss, escape, and outside-press handlers
 * keyed by layer id. Plain get/set/delete over a module map, cleared with
 * the cascade so no layer outlives its callbacks.
 */
import type { LayerHandlers } from './types'

const handlers = new Map<string, LayerHandlers>()

export function setLayerHandlers(id: string, next: LayerHandlers) {
  handlers.set(id, next)
}

export function getLayerHandlers(id: string): LayerHandlers | undefined {
  return handlers.get(id)
}

export function deleteLayerHandlers(id: string) {
  handlers.delete(id)
}

export function clearLayerHandlers() {
  handlers.clear()
}

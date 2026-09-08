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

import { isNodeInside } from '../shared/events'
import type { Layer } from './types'

export function layerDocument(layer: Layer): Document | null {
  return (
    layer.document ??
    layer.node?.ownerDocument ??
    (typeof document !== 'undefined' ? document : null)
  )
}

export function layersFor(layers: Layer[], doc?: Document | null): Layer[] {
  if (!doc) return layers
  return layers.filter(l => {
    const owner = layerDocument(l)
    return !owner || owner === doc
  })
}

export function descendantsDeepestFirst(layers: Layer[], id: string): Layer[] {
  const children = layers.filter(l => l.parentId === id)
  const out: Layer[] = []
  for (const child of children) {
    out.push(...descendantsDeepestFirst(layers, child.id), child)
  }
  return out
}

export function liveLayers(layers: Layer[], doc?: Document | null): Layer[] {
  return layersFor(layers, doc).filter(l => l.open)
}

export function getTopLiveLayer(layers: Layer[], doc?: Document | null): Layer | undefined {
  const live = liveLayers(layers, doc)
  return live[live.length - 1]
}

export function isTopLiveLayer(layers: Layer[], id: string, doc?: Document | null): boolean {
  return getTopLiveLayer(layers, doc)?.id === id
}

export function hasIsolatingLayer(layers: Layer[], doc?: Document | null): boolean {
  return layersFor(layers, doc).some(l => l.isModal)
}

export function isLayerPointerEventsEnabled(
  layers: Layer[],
  layerId: string,
  doc?: Document | null
): boolean {
  const docLayers = layersFor(layers, doc)
  const modalLayers = docLayers.filter(l => l.isModal && (l.open || l.node !== null))
  if (modalLayers.length === 0) {
    return true
  }
  const highestModal = modalLayers[modalLayers.length - 1]
  if (!highestModal) return true

  if (layerId === highestModal.id) return true

  const descendants = descendantsDeepestFirst(docLayers, highestModal.id)
  return descendants.some(d => d.id === layerId)
}

export function edgeStack(layers: Layer[], doc?: Document | null): Layer[] {
  return layersFor(layers, doc).filter(l => l.edge)
}

export function isNodeInsideLayers(node: Node | null, layers: Layer[]): boolean {
  if (!node) return false
  for (const layer of layers) {
    if (isNodeInside(layer.node, node) || isNodeInside(layer.backdrop, node)) return true
  }
  return false
}

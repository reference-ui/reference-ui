import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import type { IsolationFlags, OverlayEdge } from './types'
import { isNodeInside } from './events'

export type LayerHandlers = {
  dismiss: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
}

const handlers = new Map<string, LayerHandlers>()

export function setLayerHandlers(id: string, next: LayerHandlers) {
  handlers.set(id, next)
}

export function getLayerHandlers(id: string): LayerHandlers | undefined {
  return handlers.get(id)
}

export type Layer = {
  id: string
  parentId: string | null
  dismiss: () => void
  isModal: boolean
  isolation: IsolationFlags
  open: boolean
  edge?: OverlayEdge
  zIndex: number
  node: HTMLElement | null
  backdrop: HTMLElement | null
  trigger: HTMLElement | null
  document: Document | null
}

type OverlayStackState = {
  layers: Layer[]
  addLayer: (layer: Omit<Layer, 'zIndex'>) => void
  updateLayer: (id: string, patch: Partial<Layer>) => void
  removeLayer: (id: string) => void
  cascade: (id: string) => void
  setLayerNode: (id: string, node: HTMLElement | null) => void
  setLayerBackdrop: (id: string, node: HTMLElement | null) => void
  setLayerTrigger: (id: string, node: HTMLElement | null) => void
  setLayerOpen: (id: string, open: boolean) => void
  reset: () => void
}

/** Suppresses focus-outside races for ~2 frames after a layer leaves the stack. */
const recentlyRemoved = new Map<string, number>()

function markRemoved(id: string) {
  recentlyRemoved.set(id, Date.now())
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => recentlyRemoved.delete(id))
    })
  } else {
    setTimeout(() => recentlyRemoved.delete(id), 32)
  }
}

export function isRecentlyRemoved(id: string): boolean {
  return recentlyRemoved.has(id)
}

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

function patchLayer(layers: Layer[], id: string, patch: Partial<Layer>): Layer[] {
  const idx = layers.findIndex(l => l.id === id)
  if (idx === -1) return layers
  const next = layers.slice()
  next[idx] = { ...next[idx]!, ...patch }
  return next
}

let onStackChange: () => void = () => {}

export function setStackChangeListener(fn: () => void) {
  onStackChange = fn
}

export const overlayStackStore = createStore<OverlayStackState>((set, get) => ({
  layers: [],

  addLayer: layer => {
    set(state => {
      const idx = state.layers.findIndex(l => l.id === layer.id)
      if (idx >= 0) {
        const next = state.layers.slice()
        next[idx] = { ...next[idx]!, ...layer, zIndex: next[idx]!.zIndex }
        return { layers: next }
      }
      const last = state.layers[state.layers.length - 1]
      const zIndex = last ? last.zIndex + 10 : 100
      return { layers: [...state.layers, { ...layer, zIndex }] }
    })
    onStackChange()
  },

  updateLayer: (id, patch) => {
    set(state => ({ layers: patchLayer(state.layers, id, patch) }))
  },

  setLayerOpen: (id, open) => {
    set(state => ({ layers: patchLayer(state.layers, id, { open }) }))
    onStackChange()
  },

  setLayerNode: (id, node) => {
    set(state => {
      const current = state.layers.find(l => l.id === id)
      if (!current || current.node === node) return state
      return {
        layers: patchLayer(state.layers, id, {
          node,
          document: node?.ownerDocument ?? current.document ?? null,
        }),
      }
    })
  },

  setLayerBackdrop: (id, node) => {
    set(state => {
      const current = state.layers.find(l => l.id === id)
      if (!current || current.backdrop === node) return state
      return { layers: patchLayer(state.layers, id, { backdrop: node }) }
    })
  },

  setLayerTrigger: (id, node) => {
    set(state => {
      const current = state.layers.find(l => l.id === id)
      if (!current || current.trigger === node) return state
      return { layers: patchLayer(state.layers, id, { trigger: node }) }
    })
  },

  cascade: id => {
    const descendants = descendantsDeepestFirst(get().layers, id)
    for (const child of descendants) {
      if (get().layers.some(l => l.id === child.id && l.open)) {
        ;(getLayerHandlers(child.id)?.dismiss ?? child.dismiss)()
      }
    }
  },

  removeLayer: id => {
    const { layers } = get()
    const idx = layers.findIndex(l => l.id === id)
    if (idx === -1) return

    const descendants = descendantsDeepestFirst(layers, id)
    markRemoved(id)
    set({ layers: layers.filter(l => l.id !== id) })
    handlers.delete(id)

    for (const child of descendants) {
      if (get().layers.some(l => l.id === child.id)) {
        ;(getLayerHandlers(child.id)?.dismiss ?? child.dismiss)()
      }
    }
    onStackChange()
  },

  reset: () => {
    recentlyRemoved.clear()
    handlers.clear()
    set({ layers: [] })
    onStackChange()
  },
}))

export function useOverlayZIndex(id: string) {
  return useStore(
    overlayStackStore,
    state => state.layers.find(l => l.id === id)?.zIndex ?? 100
  )
}

export function useOverlayStore<T>(selector: (state: OverlayStackState) => T): T {
  return useStore(overlayStackStore, selector)
}

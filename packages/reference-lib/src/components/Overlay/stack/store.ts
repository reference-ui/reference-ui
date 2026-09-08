import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import {
  clearLayerHandlers,
  deleteLayerHandlers,
  getLayerHandlers,
} from './handlers'
import {
  descendantsDeepestFirst,
  hasIsolatingLayer,
  isLayerPointerEventsEnabled,
} from './query'
import type { Layer, OverlayStackState } from './types'

/**
 * Focus-outside can fire on the document after a layer unmounts.
 * Keep the id inert for two frames so the leaving layer is not treated
 * as the top live dismiss target.
 */
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

function syncEdgeStacks(layers: Layer[]) {
  const edgeLayers = layers.filter(l => l.edge && l.open && l.node)
  for (let i = 0; i < edgeLayers.length; i++) {
    const layer = edgeLayers[i]!
    if (!layer.node) continue
    const fromTop = edgeLayers.length - 1 - i
    layer.node.style.setProperty('--reference-overlay-index', String(fromTop))
    layer.node.style.setProperty('--reference-overlay-count', String(edgeLayers.length))
  }
}

export const overlayStackStore = createStore<OverlayStackState>((set, get) => ({
  layers: [],

  addLayer: layer => {
    // Same-tick pointerdown that opened this layer must not count as
    // outside press. dismiss compares event.timeStamp to openedAt.
    const openedAt = layer.open ? performance.now() : undefined
    set(state => {
      const idx = state.layers.findIndex(l => l.id === layer.id)
      if (idx >= 0) {
        const next = state.layers.slice()
        next[idx] = {
          ...next[idx]!,
          ...layer,
          openedAt: next[idx]!.openedAt ?? openedAt,
          zIndex: next[idx]!.zIndex,
        }
        return { layers: next }
      }
      const last = state.layers[state.layers.length - 1]
      const zIndex = last ? last.zIndex + 10 : 100
      return { layers: [...state.layers, { ...layer, openedAt, zIndex }] }
    })
    syncEdgeStacks(get().layers)
    onStackChange()
  },

  updateLayer: (id, patch) => {
    set(state => ({ layers: patchLayer(state.layers, id, patch) }))
    syncEdgeStacks(get().layers)
  },

  setLayerOpen: (id, open) => {
    set(state => ({
      layers: patchLayer(state.layers, id, {
        open,
        ...(open ? { openedAt: performance.now() } : {}),
      }),
    }))
    syncEdgeStacks(get().layers)
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
    syncEdgeStacks(get().layers)
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
    deleteLayerHandlers(id)
    syncEdgeStacks(get().layers)

    for (const child of descendants) {
      if (get().layers.some(l => l.id === child.id)) {
        ;(getLayerHandlers(child.id)?.dismiss ?? child.dismiss)()
      }
    }
    onStackChange()
  },

  reset: () => {
    recentlyRemoved.clear()
    clearLayerHandlers()
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

export function useLayerPointerEvents(id: string, doc?: Document | null): 'auto' | 'none' | undefined {
  return useStore(overlayStackStore, state => {
    const hasModal = hasIsolatingLayer(state.layers, doc)
    if (!hasModal) return undefined
    const enabled = isLayerPointerEventsEnabled(state.layers, id, doc)
    return enabled ? 'auto' : 'none'
  })
}

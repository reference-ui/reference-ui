import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

export type Layer = {
  id: string
  dismiss: () => void
  isModal: boolean
  zIndex: number
  node?: HTMLElement | null
}

type OverlayStackState = {
  layers: Layer[]
  addLayer: (layer: Omit<Layer, 'zIndex'>) => void
  removeLayer: (id: string) => void
  setLayerNode: (id: string, node: HTMLElement | null) => void
}

export const overlayStackStore = createStore<OverlayStackState>((set) => ({
  layers: [],
  addLayer: (layer: Omit<Layer, 'zIndex'>) =>
    set((state: OverlayStackState) => {
      const lastLayer = state.layers[state.layers.length - 1]
      const nextZIndex = lastLayer ? lastLayer.zIndex + 10 : 100
      return { layers: [...state.layers, { ...layer, zIndex: nextZIndex }] }
    }),
  removeLayer: (id: string) =>
    set((state: OverlayStackState) => {
      const idx = state.layers.findIndex((l: Layer) => l.id === id)
      if (idx === -1) return state
      
      const nextLayers = state.layers.filter((l: Layer) => l.id !== id)
      setTimeout(() => {
        const children = state.layers.slice(idx + 1)
        children.reverse().forEach((c: Layer) => c.dismiss())
      }, 0)
      
      return { layers: nextLayers }
    }),
  setLayerNode: (id: string, node: HTMLElement | null) =>
    set((state: OverlayStackState) => {
      const idx = state.layers.findIndex((l: Layer) => l.id === id)
      if (idx === -1) return state
      const nextLayers = [...state.layers]
      nextLayers[idx] = { ...nextLayers[idx], node }
      return { layers: nextLayers }
    }),
}))

export function useOverlayZIndex(id: string) {
  return useStore(overlayStackStore, (state) => state.layers.find((l) => l.id === id)?.zIndex ?? 100)
}

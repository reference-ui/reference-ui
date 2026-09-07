import { createStore } from 'zustand'

export type Layer = {
  id: string
  dismiss: () => void
  isModal: boolean
}

type OverlayStackState = {
  layers: Layer[]
  addLayer: (layer: Layer) => void
  removeLayer: (id: string) => void
}

export const overlayStackStore = createStore<OverlayStackState>((set) => ({
  layers: [],
  addLayer: (layer: Layer) => set((state: OverlayStackState) => ({ layers: [...state.layers, layer] })),
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
}))

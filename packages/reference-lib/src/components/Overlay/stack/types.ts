import type { IsolationFlags, OverlayEdge } from '../types'

export type LayerHandlers = {
  dismiss: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
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
  /** `performance.now()` at open. Same-tick opener pointerdown must not dismiss. */
  openedAt?: number
}

export type OverlayStackState = {
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

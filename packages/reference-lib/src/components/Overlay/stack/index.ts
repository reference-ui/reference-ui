export type { Layer, LayerHandlers, OverlayStackState } from './types'
export { setLayerHandlers, getLayerHandlers } from './handlers'
export {
  layerDocument,
  layersFor,
  descendantsDeepestFirst,
  liveLayers,
  getTopLiveLayer,
  isTopLiveLayer,
  hasIsolatingLayer,
  isLayerPointerEventsEnabled,
  edgeStack,
  isNodeInsideLayers,
} from './query'
export {
  overlayStackStore,
  isRecentlyRemoved,
  setStackChangeListener,
  useOverlayZIndex,
  useOverlayStore,
  useLayerPointerEvents,
} from './store'

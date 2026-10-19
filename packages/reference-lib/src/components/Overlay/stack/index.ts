/**
 * Layer-stack barrel: the shared registry every popup configures against.
 * Ships the store, its React bindings, the pure layer queries, and the
 * handler map over the `Layer` vocabulary, keeping cascade internals
 * private.
 */
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

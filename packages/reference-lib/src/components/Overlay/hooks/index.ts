/**
 * Root and Content lifecycle hooks: open state, the part registry, layer
 * stack membership, Content node publication, and child-layer sharding.
 * Composed by `Overlay.tsx` and `parts/Content`; no JSX lives here.
 */
export { useOverlayOpenState } from './use-open-state'
export { usePartRegistry } from './use-part-registry'
export { useOverlayLayer } from './use-overlay-layer'
export { useLayerNode } from './use-layer-node'
export { useChildShards } from './use-child-shards'

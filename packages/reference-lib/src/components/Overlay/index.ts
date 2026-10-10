/**
 * Overlay's public surface: the compound root, its geometry and isolation
 * vocabulary, plus the stack store and event-path helpers sibling popups
 * (Popover, Menu, Tooltip) coordinate through. Re-exports only.
 */
export * from './Overlay'
export { overlayStackStore, useOverlayZIndex } from './stack'
export {
  eventPath,
  isEventInside,
  isNodeInside,
  closestFromEvent,
  eventElement,
  isPrimaryPointer,
  isEditableTarget,
  markEventConsumed,
  isEventConsumed,
} from './shared/events'

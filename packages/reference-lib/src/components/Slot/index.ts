/**
 * Slot public barrel: re-exports only, zero logic. The surface is the
 * historical `Slot.ts` contract — types, the registry store, visibility,
 * the host helpers, and the context factory — with the internal
 * registration container and id sequence deliberately left unexported.
 */
export type {
  SlotVisibility,
  ResolvedSlotVisibility,
  SlotRegistration,
  UseSlotRegistrationOptions,
  SlotRootContext,
} from './types'
export { SlotRoot } from './registry/store'
export { resolveSlotVisibility } from './visibility/visibility'
export { createSlotCacheKey } from './host/cache-key'
export { transformSlotElements } from './host/transform'
export { createSlotRootContext } from './context'

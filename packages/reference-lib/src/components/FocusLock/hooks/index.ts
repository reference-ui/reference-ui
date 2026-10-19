/**
 * FocusLock hooks: session, shards, composed ref, memory, restore,
 * activation, and containment. Re-exports the bindings the root composes
 * in effect order; no logic lives here.
 */
export { useLockSession } from './use-lock-session'
export type { FocusLockSession } from './use-lock-session'
export { useShards } from './use-shards'
export { useComposedRef } from './use-composed-ref'
export { useInsideMemory } from './use-inside-memory'
export { useRestore } from './use-restore'
export { useActivation } from './use-activation'
export { useContainment } from './use-containment'

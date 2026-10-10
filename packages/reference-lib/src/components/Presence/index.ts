/**
 * Presence public surface. Re-exports only — the root component, its types,
 * its contexts, and the two hooks headless consumers need (`usePresence` for
 * Toast, `usePresenceCoordinator` for Overlay).
 */

export * from './Presence'
export * from './types'
export * from './context'
export { usePresenceCoordinator } from './hooks/use-presence-coordinator'

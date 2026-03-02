/**
 * Event registry for the sync flow.
 * Maps event names to their payload types for type-safe emit/on usage.
 */
export type SyncEvents = {
  // Add as we build out the pipeline, e.g.:
  // 'sync:complete': Record<string, never>
  // 'virtual:ready': { path: string }
}

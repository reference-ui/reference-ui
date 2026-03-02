/**
 * Event registry for the sync flow.
 * Maps event names to their payload types for type-safe emit/on usage.
 */
export type SyncEvents = {
  'watch:change': { event: 'add' | 'change' | 'unlink'; path: string }
}

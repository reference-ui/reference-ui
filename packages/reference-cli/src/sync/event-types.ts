/**
 * Sync module events – pure type, no runtime imports.
 * Split from events.ts to avoid circular dependency with event-bus.
 */
export type SyncEvents = {
  /** Emitted by sync hub when watch:change is processed; passed to workers */
  'sync:changed': { event: 'add' | 'change' | 'unlink'; path: string }
  /** Emitted when cold sync (packager, etc.) is complete */
  'sync:complete': Record<string, never>
}

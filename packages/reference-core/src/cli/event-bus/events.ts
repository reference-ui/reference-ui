/**
 * Event registry - maps event names to their payload types
 * Add new events here to get type safety and autocomplete
 */
export type Events = {
  'log:info': { message: string; args?: unknown[] }
  'log:debug': { message: string; args?: unknown[] }
  'log:error': { message: string; args?: unknown[] }
  'panda:config:created': { configPath: string }
  /** Emitted when packager finishes bundling; packager-ts listens to regenerate .d.ts */
  'packager:complete': Record<string, never>
  /** Emitted when watch worker is ready and monitoring files */
  'watch:ready': { sourceDir: string; patterns: string[] }
  /** Emitted when a file changes - consumed by virtual, system, etc. */
  'watch:change': { event: 'add' | 'change' | 'unlink'; path: string; stats?: any }
  /** Emitted when watcher encounters an error */
  'watch:error': { error: string }
}

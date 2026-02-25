/**
 * Event registry - maps event names to their payload types
 * Add new events here to get type safety and autocomplete
 */
export type LogEvents = {
  'log:info': { message: string; args?: unknown[] }
  'log:debug': { module: string; message: string; args?: unknown[] }
  'log:error': { message: string; args?: unknown[] }
}

export type WatchEvents = {
  /** Emitted when watch worker is ready and monitoring files */
  'watch:ready': { sourceDir: string; patterns: string[] }
  /** Emitted when a file changes - consumed by virtual, system, etc. */
  'watch:change': { event: 'add' | 'change' | 'unlink'; path: string; stats?: any }
  /** Emitted when watcher encounters an error */
  'watch:error': { error: string }
}

export type SystemEvents = {
  /** Emitted when Panda config is created */
  'system:config:created': { configPath: string }
  /** Emitted when system finishes compiling (eval, config, codegen, CSS) */
  'system:compiled': Record<string, never>
}

export type PackagerEvents = {
  /** Emitted when packager finishes bundling; packager-ts listens to regenerate .d.ts */
  'packager:complete': Record<string, never>
}

export type VirtualEvents = {
  /** Emitted when virtual transforms a file; system/pipeline listens for incremental updates */
  'virtual:fs:change': { event: 'add' | 'change' | 'unlink'; path: string }
}

export type Events = LogEvents &
  WatchEvents &
  SystemEvents &
  PackagerEvents &
  VirtualEvents

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
  /** Emitted when a file changes - consumed by virtual, system, etc. */
  'watch:change': { event: 'add' | 'change' | 'unlink'; path: string; stats?: any }
}

export type SystemEvents = {
  /** Emitted when Panda config is created */
  'system:config:created': { configPath: string }
  /** Emitted when eval + config are done; gen worker runs Panda on this */
  'config:ready': Record<string, never>
  /** Emitted when gen worker has bootstrapped and is listening; system may re-emit config:ready */
  'gen:ready': Record<string, never>
  /** Emitted when system finishes compiling (eval, config, codegen, CSS) */
  'system:compiled': Record<string, never>
  /** Emitted when Panda has written styles.css – packager copies to install location */
  'panda:css:compiled': Record<string, never>
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

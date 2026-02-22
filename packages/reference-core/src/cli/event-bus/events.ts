/**
 * Event registry - maps event names to their payload types
 * Add new events here to get type safety and autocomplete
 */
export type Events = {
  'log:info': { message: string; args?: unknown[] }
  'log:debug': { message: string; args?: unknown[] }
  'log:error': { message: string; args?: unknown[] }
  'panda:config:created': { configPath: string }
}

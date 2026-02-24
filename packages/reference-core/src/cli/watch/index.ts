/**
 * Watch module for monitoring file changes
 * Runs in a dedicated worker thread
 */

export { initWatch } from './init'
export { runWatch } from './worker'
export type { WatchPayload } from './types'

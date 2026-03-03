/**
 * Dummy worker – maps events to handlers. Runs in a worker thread so BroadcastChannel
 * delivers events (cross-thread). Event orchestration is in sync/events.ts; this file
 * is a flat list of on(event, handler) where handlers live in logic.ts.
 */
import { on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { onEventA, onEventB, onSyncChanged } from './logic'

export default async function runDummy(): Promise<never> {
  on('sync:changed', onSyncChanged)
  on('sync:changed', onEventA)
  on('sync:changed', onEventB)
  return KEEP_ALIVE
}

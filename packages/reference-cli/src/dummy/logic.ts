import { emit } from '../lib/event-bus'

const DEFAULT_DELAY_MS = 500

function emitSyncCompleteAfterDelay(delayMs = DEFAULT_DELAY_MS): void {
  setTimeout(() => emit('sync:complete'), delayMs)
}

/** Handler for sync:changed – emits sync:complete after delay. */
export function onSyncChanged(): void {
  emitSyncCompleteAfterDelay()
}

/** Example handler for sync:changed. */
export function onEventA(_payload: { event: string; path: string }): void {
  // example – does nothing, just shows multiple handlers on same event
}

/** Example handler for sync:changed. */
export function onEventB(_payload: { event: string; path: string }): void {
  // example – does nothing, just shows multiple handlers on same event
}

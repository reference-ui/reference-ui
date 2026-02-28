import { emit, once } from './channel'
import type { Events } from './events'

/**
 * Events that each module must emit before the cold sync pipeline is considered complete.
 * Used by initSyncComplete() to know when to emit sync:complete.
 */
export const SYNC_COMPLETE_GATES = {
  /** Packager - emits when bundling and install to node_modules is done */
  packager: 'packager:complete' as const,
  /** Packager-ts - emits when .d.ts generation is done (skipped when config.skipTypescript) */
  packagerTs: 'packager-ts:complete' as const,
} satisfies Record<string, keyof Events>

export type SyncCompleteConfig = {
  /** When true, packager-ts is skipped; packager:complete is the final gate */
  skipTypescript?: boolean
}

/**
 * Initialize the sync-complete listener.
 * Waits for all required gates (based on config), then emits sync:complete.
 * Call once at cold sync start. The sync command listens for sync:complete to exit.
 */
export function initSyncComplete(config: SyncCompleteConfig): void {
  const required =
    config.skipTypescript === true
      ? [SYNC_COMPLETE_GATES.packager]
      : [SYNC_COMPLETE_GATES.packager, SYNC_COMPLETE_GATES.packagerTs]

  const received = new Set<string>()

  for (const event of required) {
    once(event, () => {
      received.add(event)
      if (received.size === required.length) {
        emit('sync:complete', {})
      }
    })
  }
}

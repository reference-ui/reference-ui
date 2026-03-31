/**
 * Virtual module events – triggers and notifications.
 * Triggers: when emitted, virtual runs an action.
 * Notifications: emitted when virtual completes an action.
 * Transform is part of copy – no separate events.
 */
export type VirtualEvents = {
  /** Emitted when virtual worker is ready to receive triggers */
  'virtual:ready': Record<string, never>
  /** Run full copy to .reference-ui/virtual */
  'run:virtual:copy:all': Record<string, never>
  /** Sync a single file (add/change/unlink, payload from watch:change) */
  'run:virtual:sync:file': { event: 'add' | 'change' | 'unlink'; path: string }
  /** Emitted when one file is copied/transformed (copy+transform combined) */
  'virtual:fs:change': { event: 'add' | 'change' | 'unlink'; path: string }
  /** Emitted when the source mirror is ready for downstream seeding steps. */
  'virtual:copy:complete': { virtualDir: string }
  /** Emitted when virtual cannot complete a copy or sync operation. */
  'virtual:failed': {
    operation: 'copy:all' | 'sync:file'
    message: string
    event?: 'add' | 'change' | 'unlink'
    path?: string
  }
  /** Emitted when virtual full copy to .reference-ui/virtual is complete */
  'virtual:complete': Record<string, never>
}

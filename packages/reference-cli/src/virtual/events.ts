/**
 * Virtual module events – triggers and notifications.
 * Triggers: when emitted, virtual runs an action.
 * Notifications: emitted when virtual completes an action.
 */
export type VirtualEvents = {
  /** Emitted when virtual worker is ready to receive triggers */
  'virtual:ready': Record<string, never>
  /** Run full copy to .reference-ui/virtual */
  'run:virtual:copy:all': Record<string, never>
  /** Emitted when virtual copy to .reference-ui/virtual is complete */
  'virtual:complete': Record<string, never>
}

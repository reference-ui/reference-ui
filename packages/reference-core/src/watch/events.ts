/**
 * Watch module events.
 */
export type WatchEvents = {
  /** Emitted by watch worker when files change */
  'watch:change': { event: 'add' | 'change' | 'unlink'; path: string }
}

import { on } from '../lib/event-bus'

interface WatchReadyOptions {
  onReady: () => void
  onCycleStart?: () => void
}

/**
 * Watch-mode readiness policy.
 *
 * Browser refreshes become safe once the runtime bundle is on disk. The later
 * runtime declaration pass, reference build, and final `@reference-ui/types`
 * packaging continue in the background.
 */
export function initWatchReady({ onReady, onCycleStart }: WatchReadyOptions): void {
  let readyEmitted = false

  const emitReady = () => {
    if (readyEmitted) return
    readyEmitted = true
    onReady()
  }

  on('watch:change', () => {
    readyEmitted = false
    onCycleStart?.()
  })

  on('packager:runtime:complete', () => {
    emitReady()
  })
}
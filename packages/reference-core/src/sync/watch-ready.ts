import { on } from '../lib/event-bus'

interface WatchReadyOptions {
  onReady: () => void
  onCycleStart?: () => void
}

/**
 * Watch-mode readiness policy.
 *
 * Browser refreshes become safe once both the generated stylesheet is on disk
 * and the runtime package copy is complete. Consumers may import either the
 * direct Panda output or the exported `@reference-ui/react/styles.css` copy, so
 * watch readiness must wait for both surfaces in the current cycle.
 */
export function initWatchReady({ onReady, onCycleStart }: WatchReadyOptions): void {
  let readyEmitted = false
  let pandaCssReady = false
  let runtimeBundleReady = false

  const emitReadyIfReady = () => {
    if (!pandaCssReady || !runtimeBundleReady || readyEmitted) return
    readyEmitted = true
    onReady()
  }

  on('watch:change', () => {
    readyEmitted = false
    pandaCssReady = false
    runtimeBundleReady = false
    onCycleStart?.()
  })

  on('system:panda:css', () => {
    pandaCssReady = true
    emitReadyIfReady()
  })

  on('packager:runtime:complete', () => {
    runtimeBundleReady = true
    emitReadyIfReady()
  })
}
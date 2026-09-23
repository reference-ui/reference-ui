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
  let changeSeq = 0
  let buildingSeq = 0
  let cssSeq = 0
  let packageSeq = 0

  const emitReadyIfReady = () => {
    if (
      !pandaCssReady ||
      !runtimeBundleReady ||
      readyEmitted ||
      cssSeq < changeSeq ||
      packageSeq < changeSeq
    ) {
      return
    }
    readyEmitted = true
    onReady()
  }

  on('watch:change', () => {
    changeSeq++
    readyEmitted = false
    pandaCssReady = false
    runtimeBundleReady = false
    onCycleStart?.()
  })

  on('run:system:config', () => {
    buildingSeq = changeSeq
  })

  on('system:panda:css', () => {
    cssSeq = buildingSeq || changeSeq
    pandaCssReady = true
    emitReadyIfReady()
  })

  on('packager:runtime:complete', () => {
    packageSeq = buildingSeq || changeSeq
    runtimeBundleReady = true
    emitReadyIfReady()
  })
}
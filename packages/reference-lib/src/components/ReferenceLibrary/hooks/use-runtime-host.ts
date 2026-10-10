/**
 * Activates one ReferenceLibrary mount as a document runtime host. The hook
 * mints the mount's stable host id, reads the current election result during
 * render, and runs a single layout effect that initializes focus-visible
 * tracking, applies the Tooltip warm-group delay, registers the mount with the
 * election, and subscribes to sibling arrivals and departures. The three
 * behaviors deliberately share one effect and one dependency pair: a skip-delay
 * rerender re-runs registration, and splitting them into separate hooks would
 * change failover timing. Cleanup unsubscribes first, then unregisters so a
 * departing host hands ownership to the next live mount. Returns the host id
 * and whether this mount is the elected host; renders only data, never JSX.
 */
import * as React from 'react'
import { setupFocusVisible } from '../../../core/theme/primitives/forms/focus-visible'
import { getLibraryStore, registerHost, subscribeHost, unregisterHost } from '../election/store'
import { nextLibraryHostId } from '../shared/ids'
import { applyTooltipSkipDelay } from '../warmup/tooltip-config'

export function useRuntimeHost(skipDelay: number | undefined): {
  hostId: string
  isActiveHost: boolean
} {
  const hostIdRef = React.useRef<string | null>(null)
  if (hostIdRef.current === null) {
    hostIdRef.current = nextLibraryHostId()
  }
  const hostId = hostIdRef.current

  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  const store = typeof document !== 'undefined' ? getLibraryStore(document) : null

  React.useLayoutEffect(() => {
    if (typeof document === 'undefined') return

    const doc = document
    setupFocusVisible(doc)
    applyTooltipSkipDelay(doc, skipDelay)

    const runtime = registerHost(hostId, doc, () => {
      forceUpdate()
    })
    const unsubscribe = subscribeHost(runtime, () => {
      forceUpdate()
    })

    return () => {
      unsubscribe()
      unregisterHost(hostId, doc)
    }
  }, [hostId, skipDelay])

  return { hostId, isActiveHost: store?.activeHostId === hostId }
}

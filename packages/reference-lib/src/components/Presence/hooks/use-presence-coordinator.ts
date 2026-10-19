/**
 * Sibling-part coordination hook: wraps the coordinator ledger in refs so
 * Overlay's Backdrop and Content report together. Registers while closed,
 * reports on exit completion, and releases the overlay once every part
 * has reported.
 */
import * as React from 'react'
import type { PresenceCoordinatorContextValue } from '../types'
import { CoordinatorLedger } from '../coordination/ledger'

/**
 * Per-cycle sibling-part coordinator for Overlay's Backdrop/Content pair.
 * Wraps one `CoordinatorLedger` (stable across renders via ref) in the
 * `PresenceCoordinatorContextValue` callbacks: parts register on mount and
 * report when their own effects finish, and the ledger releases every
 * suspended part on a microtask once all have reported while closed.
 * Reopening clears the finished count so the next close starts fresh.
 */

export function usePresenceCoordinator(
  present: boolean
): PresenceCoordinatorContextValue {
  const presentRef = React.useRef(present)
  presentRef.current = present

  const ledgerRef = React.useRef<CoordinatorLedger | null>(null)
  if (ledgerRef.current === null) {
    ledgerRef.current = new CoordinatorLedger(() => presentRef.current)
  }
  const ledger = ledgerRef.current

  React.useEffect(() => {
    if (present) {
      ledger.reset()
    }
  }, [present, ledger])

  const registerPart = React.useCallback(
    (id: string) => {
      ledger.register(id)
    },
    [ledger]
  )

  const unregisterPart = React.useCallback(
    (id: string) => {
      ledger.unregister(id)
    },
    [ledger]
  )

  const reportPartFinished = React.useCallback(
    (id: string) => {
      ledger.reportFinished(id)
    },
    [ledger]
  )

  const subscribeToAllComplete = React.useCallback(
    (cb: () => void) => {
      return ledger.subscribe(cb)
    },
    [ledger]
  )

  const isCoordinatorActive = React.useCallback(() => {
    return ledger.isActive()
  }, [ledger])

  return React.useMemo(
    () => ({
      registerPart,
      unregisterPart,
      reportPartFinished,
      subscribeToAllComplete,
      isCoordinatorActive,
    }),
    [
      registerPart,
      unregisterPart,
      reportPartFinished,
      subscribeToAllComplete,
      isCoordinatorActive,
    ]
  )
}

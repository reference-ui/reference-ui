/**
 * `createUseSlotRegistration` binds the filler hook to one slot context.
 * Each instance registers a single live container (see
 * `registration/live`) exactly once, re-registers it in place when the
 * slot id or structural `deps` change, and unregisters on unmount. Omitted
 * `deps` means register-once: element, meta, and visibility flow through
 * the live getters without ever touching the store version.
 */
import * as React from 'react'
import type { SlotRoot } from '../registry/store'
import type { SlotRegistration, UseSlotRegistrationOptions } from '../types'
import { createLiveRegistration } from '../registration/live'
import { nextSlotRegistrationId } from '../shared/ids'

export function createUseSlotRegistration<TMeta>(
  useRoot: () => SlotRoot<TMeta>
): (options: UseSlotRegistrationOptions<TMeta>, deps?: React.DependencyList) => void {
  function useSlotRegistration(
    options: UseSlotRegistrationOptions<TMeta>,
    deps: React.DependencyList = []
  ): void {
    const root = useRoot()
    const regIdRef = React.useRef<string | null>(null)
    if (regIdRef.current === null) {
      regIdRef.current = nextSlotRegistrationId()
    }
    const regId = regIdRef.current

    // Live getters held in a ref container
    const latestRef = React.useRef(options)
    latestRef.current = options

    // In-place registration container object with live getters
    const slotContainerRef = React.useRef<SlotRegistration<TMeta> | null>(null)
    if (!slotContainerRef.current) {
      slotContainerRef.current = createLiveRegistration(latestRef)
    }

    React.useLayoutEffect(() => {
      // Re-register in place when slotId or deps change
      root.register(regId, slotContainerRef.current!)
    }, [root, regId, options.slotId, ...deps])

    React.useEffect(() => {
      return () => {
        root.unregister(regId)
      }
    }, [root, regId])
  }
  return useSlotRegistration
}

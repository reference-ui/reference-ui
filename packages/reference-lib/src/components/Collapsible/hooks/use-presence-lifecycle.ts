/**
 * Presence lifecycle: pings the session while the panel is mounted so the
 * trigger keeps its aria-controls link through the exit transition and only
 * drops it once Content actually unmounts (CO-DOM-03).
 */
import * as React from 'react'

export function usePresenceLifecycle(
  setIsContentPresent: ((present: boolean) => void) | undefined
): void {
  React.useEffect(() => {
    setIsContentPresent?.(true)
    return () => {
      setIsContentPresent?.(false)
    }
  }, [setIsContentPresent])
}

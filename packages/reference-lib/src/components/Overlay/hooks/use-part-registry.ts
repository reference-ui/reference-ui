import * as React from 'react'
import type { OverlayPartName } from './context'
import type { OverlayEdge } from './types'
import { overlayWarn } from './shared/warn'

export function usePartRegistry(edge?: OverlayEdge, mixedGeometry = false) {
  const registeredParts = React.useRef(new Map<string, number>())
  const [isCorrupted, setIsCorrupted] = React.useState(false)

  const registerPart = React.useCallback(
    (name: OverlayPartName) => {
      const current = (registeredParts.current.get(name) ?? 0) + 1
      registeredParts.current.set(name, current)
      if (current > 1) {
        overlayWarn(
          `Duplicate Overlay.${name[0].toUpperCase() + name.slice(1)} detected: an Overlay may define at most one ${name} part.`
        )
        setIsCorrupted(true)
      }
      if (name === 'handle' && !edge) {
        overlayWarn('Overlay.Handle requires `edge`.')
        setIsCorrupted(true)
      }
      return () => {
        const next = (registeredParts.current.get(name) ?? 1) - 1
        if (next <= 0) registeredParts.current.delete(name)
        else registeredParts.current.set(name, next)
      }
    },
    [edge]
  )

  React.useEffect(() => {
    if (mixedGeometry) {
      overlayWarn('`edge` and `anchor` are mutually exclusive.')
      setIsCorrupted(true)
    }
  }, [mixedGeometry])

  return { registeredParts, isCorrupted, setIsCorrupted, registerPart }
}

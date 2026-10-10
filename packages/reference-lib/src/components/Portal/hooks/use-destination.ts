/**
 * Destination lifecycle for Portal: the client mount gate plus the two
 * watchers that keep the resolved node fresh. `useDestination` opens the
 * mount gate in a layout effect (so the server and first paint render
 * nothing), re-resolves on every commit (so a swapped `container` prop
 * moves the subtree exactly once), and frame-checks unresolved ref
 * destinations (so a target attached after mount still gets its copy).
 * Returns data only — `{ mounted, node }` — never JSX.
 */
import * as React from 'react'
import type { PortalContainer, PortalProps } from '../types'
import { resolveContainer } from '../destination/resolve'
import { isContainerRef } from '../shared/refs'

export function useDestination(containerProp?: PortalProps['container']): {
  mounted: boolean
  node: PortalContainer | null
} {
  const [mounted, setMounted] = React.useState(false)
  const [resolvedNode, setResolvedNode] = React.useState<PortalContainer | null>(null)

  React.useLayoutEffect(() => {
    setMounted(true)
    const node = resolveContainer(containerProp)
    setResolvedNode(node)
  }, [containerProp])

  // Synchronize on commit
  React.useLayoutEffect(() => {
    const node = resolveContainer(containerProp)
    if (node !== resolvedNode) {
      setResolvedNode(node)
    }
  })

  // Frame check for late-attaching RefObject destinations
  React.useEffect(() => {
    if (isContainerRef(containerProp) && !resolvedNode) {
      const raf = requestAnimationFrame(() => {
        const node = resolveContainer(containerProp)
        if (node && node !== resolvedNode) {
          setResolvedNode(node)
        }
      })
      return () => cancelAnimationFrame(raf)
    }
  })

  return { mounted, node: resolvedNode }
}

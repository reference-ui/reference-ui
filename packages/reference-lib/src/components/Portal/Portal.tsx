import * as React from 'react'
import * as ReactDOM from 'react-dom'

export type PortalContainer = Element | DocumentFragment

export type PortalContainerRef = {
  current: PortalContainer | null
}

export interface PortalProps {
  children?: React.ReactNode
  container?:
    | PortalContainer
    | PortalContainerRef
    | (() => PortalContainer | null)
    | null
}

function resolveContainer(
  containerProp?:
    | PortalContainer
    | PortalContainerRef
    | (() => PortalContainer | null)
    | null
): PortalContainer | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null
  }

  // 1. Omitted or explicitly null -> default to document.body
  if (containerProp === undefined || containerProp === null) {
    return document.body
  }

  // 2. Ref object ({ current: ... })
  if (typeof containerProp === 'object' && 'current' in containerProp) {
    return containerProp.current
  }

  // 3. Resolver function (() => ...)
  if (typeof containerProp === 'function') {
    return containerProp()
  }

  // 4. Direct Element or DocumentFragment
  if (
    containerProp instanceof Element ||
    containerProp instanceof DocumentFragment
  ) {
    return containerProp
  }

  return null
}

export function Portal({ children, container: containerProp }: PortalProps) {
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
    if (
      typeof containerProp === 'object' &&
      containerProp !== null &&
      'current' in containerProp &&
      !resolvedNode
    ) {
      const raf = requestAnimationFrame(() => {
        const node = resolveContainer(containerProp)
        if (node && node !== resolvedNode) {
          setResolvedNode(node)
        }
      })
      return () => cancelAnimationFrame(raf)
    }
  })

  if (!mounted || !children || !resolvedNode) {
    return null
  }

  return ReactDOM.createPortal(children, resolvedNode)
}

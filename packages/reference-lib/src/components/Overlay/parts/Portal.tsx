/**
 * Configuration part, not a wrapper: publishes the portal container for
 * Backdrop and Content and renders only its children. An omitted container
 * follows the trigger's root via `portal-container`.
 */
import * as React from 'react'
import type { OverlayPortalProps } from '../types'
import { OverlayContext } from '../context'

export function OverlayPortal({ children, container }: OverlayPortalProps) {
  const context = React.useContext(OverlayContext)

  React.useLayoutEffect(() => {
    if (!context) return
    context.setPortalContainer(container)
    const unregister = context.registerPart('portal')
    return () => {
      unregister?.()
      context.setPortalContainer(undefined)
    }
  }, [context, container])

  return <>{children}</>
}

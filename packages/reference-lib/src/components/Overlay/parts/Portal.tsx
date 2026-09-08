import * as React from 'react'
import type { PortalProps } from '../../Portal'
import { OverlayContext } from '../context'

export function OverlayPortal({ children, container }: PortalProps) {
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

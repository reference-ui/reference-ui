/**
 * Portal root: composition only. `Portal` asks `hooks/use-destination` for
 * the mount gate and the resolved destination node, renders nothing until
 * mount, children, and node are all present, and otherwise relays the
 * children through `ReactDOM.createPortal` wrapped in `scope/PortalScope`.
 * No resolution math, no lifecycle, and no providers live here — only the
 * decision to portal and the single `createPortal` call that does it.
 */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import type { PortalProps } from './types'
import { useDestination } from './hooks/use-destination'
import { PortalScope } from './scope/PortalScope'

export function Portal({ children, container: containerProp }: PortalProps) {
  const { mounted, node } = useDestination(containerProp)

  if (!mounted || !children || !node) {
    return null
  }

  return ReactDOM.createPortal(<PortalScope node={node}>{children}</PortalScope>, node)
}

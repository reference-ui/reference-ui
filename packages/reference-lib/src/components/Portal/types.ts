/**
 * Public Portal prop and container types. `PortalContainer` is the
 * destination an element tree relocates into, `PortalContainerRef` is a
 * late-attaching destination held in a ref object, and `PortalProps`
 * accepts a container as element, fragment, ref, resolver, or null. No JSX
 * and no logic live here — resolution owns `destination/`, lifecycle owns
 * `hooks/`, and this file is the vocabulary they share.
 */
import type * as React from 'react'

export type PortalContainer = Element | DocumentFragment

export type PortalContainerRef = {
  current: PortalContainer | null
}

export interface PortalProps {
  /** Content to render in the container. */
  children?: React.ReactNode
  /**
   * Where the children render. `null` means `document.body`.
   * @default document.body
   */
  container?:
    | PortalContainer
    | PortalContainerRef
    | (() => PortalContainer | null)
    | null
}

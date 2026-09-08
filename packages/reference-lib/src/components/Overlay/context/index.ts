import * as React from 'react'
import type { PortalProps } from '../../Portal'
import type {
  IsolationFlags,
  OverlayAnchor,
  OverlayEdge,
  OverlayProps,
} from '../types'
import { overlayWarn } from '../shared/warn'

export { overlayWarn }

/** React context for Overlay parts. */

export type OverlayPartName =
  | 'trigger'
  | 'backdrop'
  | 'content'
  | 'handle'
  | 'portal'
  | 'arrow'

export interface OverlayContextValue {
  id: string
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isolation: IsolationFlags
  anchor?: OverlayAnchor
  edge?: OverlayEdge
  closeOnScroll?: boolean
  presence: boolean
  mixedGeometry: boolean
  isCorrupted: boolean
  registerPart: (part: OverlayPartName) => () => void
  portalContainer?: PortalProps['container']
  setPortalContainer: (container: PortalProps['container']) => void
  contentRef: React.MutableRefObject<HTMLDivElement | null>
  triggerRef: React.MutableRefObject<HTMLElement | null>
  arrowRef: React.MutableRefObject<HTMLDivElement | null>
  onEscape?: OverlayProps['onEscape']
  onOutsidePress?: OverlayProps['onOutsidePress']
  onInteractOutside?: OverlayProps['onInteractOutside']
  onDismiss?: OverlayProps['onDismiss']
  onOpen?: OverlayProps['onOpen']
}

export const OverlayContext = React.createContext<OverlayContextValue | null>(null)

export function useOverlay() {
  return React.useContext(OverlayContext)
}

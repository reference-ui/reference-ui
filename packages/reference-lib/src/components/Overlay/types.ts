import type * as React from 'react'
import type { PortalProps } from '../Portal'
import type { FocusTarget } from '../FocusLock'
import type { Placement, Strategy, VirtualAnchor } from './geometry/floating'

export type OverlayPlacement = Placement
export type OverlayEdge = 'top' | 'bottom' | 'left' | 'right'
export type OverlayStrategy = Strategy

export type OverlayAnchor =
  | HTMLElement
  | VirtualAnchor
  | React.RefObject<HTMLElement | null>
  | { x: number; y: number; width?: number; height?: number }
  | null

export type OverlayIsolation =
  | boolean
  | {
      focus?: boolean
      inert?: boolean
      scroll?: boolean
    }

export type IsolationFlags = {
  focus: boolean
  inert: boolean
  scroll: boolean
}

export interface OverlayDismissHandlers {
  onDismiss?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onOutsidePress?: (event: PointerEvent) => void
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
}

export interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onOpenChange?: (open: boolean) => void
  isolation?: OverlayIsolation
  anchor?: OverlayAnchor
  edge?: OverlayEdge
  closeOnScroll?: boolean
  /** When false, closed Content unmounts immediately (Tooltip). Default true. */
  presence?: boolean
}

export function resolveIsolation(prop: OverlayIsolation = true): IsolationFlags {
  if (typeof prop === 'boolean') {
    return { focus: prop, inert: prop, scroll: prop }
  }
  return {
    focus: prop.focus ?? true,
    inert: prop.inert ?? true,
    scroll: prop.scroll ?? true,
  }
}

export interface OverlayPortalProps {
  children?: React.ReactNode
  container?: PortalProps['container']
}

export interface OverlayContentGeometry {
  placement?: OverlayPlacement
  offset?: number
  collisionPadding?: number
  strategy?: OverlayStrategy
  flip?: boolean
  shift?: boolean
  initialFocus?: FocusTarget | boolean
  restoreFocus?: boolean | FocusTarget
}

/**
 * Overlay public vocabulary: placements, edges, strategies, anchors, and
 * isolation flags over the Portal and FocusLock contracts. The one type
 * module every Overlay part, hook, and domain imports from.
 */
import type * as React from 'react'
import type { PortalProps } from '../Portal'
import type { FocusTarget } from '../FocusLock'
import type { Placement, Strategy, VirtualAnchor, Side, Alignment } from './geometry/floating'

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
  /**
   * Called when something asks to close an open layer: the Trigger, Escape,
   * an outside press, the Handle, or scroll.
   */
  onDismiss?: () => void
  /** Runs before closing on Escape. `preventDefault()` keeps the layer open. */
  onEscape?: (event: KeyboardEvent) => void
  /** Runs before closing on a press outside. `preventDefault()` keeps the layer open. */
  onOutsidePress?: (event: PointerEvent) => void
  /** Runs after `onOutsidePress`. `preventDefault()` keeps the layer open. */
  onInteractOutside?: (event: PointerEvent | FocusEvent) => void
}

export interface OverlayProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  /** Controlled open state. */
  open?: boolean
  /**
   * Open state on first render, when `open` is omitted.
   * @default false
   */
  defaultOpen?: boolean
  /** Called when the Trigger asks to open. */
  onOpen?: () => void
  /** Called with the requested state on every open or close request. */
  onOpenChange?: (open: boolean) => void
  /**
   * Focus lock, inert page, and scroll lock. An object turns single settings off.
   * @default true
   */
  isolation?: OverlayIsolation
  /** Positions Content against this reference. */
  anchor?: OverlayAnchor
  /** Binds Content to a viewport edge. */
  edge?: OverlayEdge
  /**
   * Close when a scrolling ancestor moves the anchor.
   * @default false
   */
  closeOnScroll?: boolean
  /**
   * `false` unmounts Content as soon as it closes, with no exit animation.
   * @default true
   */
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
  /**
   * Destination. See Portal.
   * @default document.body
   */
  container?: PortalProps['container']
}

export interface OverlayPositionChangeData {
  placement: OverlayPlacement
  side: Side
  align: string
  nudgedLeft: number
  nudgedTop: number
}

export interface OverlayContentGeometry {
  /**
   * Side and alignment when anchored.
   * @default 'bottom-start'
   */
  placement?: OverlayPlacement
  /**
   * Gap in pixels from the anchor, or from the edge.
   * @default 8
   */
  offset?: number
  /**
   * Space in pixels kept from the boundary.
   * @default 8
   */
  collisionPadding?: number
  /**
   * Area Content flips and shifts to stay inside.
   * @default 'viewport'
   */
  boundary?: HTMLElement | VirtualAnchor | React.RefObject<HTMLElement | null> | 'viewport' | null
  /** Placements to try, in order, when flipping. */
  fallbackPlacements?: OverlayPlacement[]
  /**
   * Reposition every frame. Only for anchors moved by `transform`.
   * @default false
   */
  animationFrame?: boolean
  /** Called with `{ placement, side, align, nudgedLeft, nudgedTop }` when the position changes. */
  onPositionChange?: (data: OverlayPositionChangeData) => void
  /**
   * CSS position used when anchored.
   * @default 'absolute'
   */
  strategy?: OverlayStrategy
  /**
   * Move to the opposite side when there is no room.
   * @default true
   */
  flip?: boolean
  /**
   * Slide along the side to stay in the boundary.
   * @default true
   */
  shift?: boolean
  /**
   * Where focus goes on open. `false` leaves focus where it is.
   * @default first tabbable
   */
  initialFocus?: FocusTarget | boolean
  /**
   * Where focus goes after close. `true` returns it to where it was before opening.
   * @default true
   */
  restoreFocus?: boolean | FocusTarget
}

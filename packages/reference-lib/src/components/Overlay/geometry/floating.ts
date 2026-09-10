import { hiddenByClipping } from './clipping'

export { getOverflowAncestors } from './clipping'
export { autoUpdate } from './auto-update'
export type { AutoUpdateOptions } from './auto-update'

export type Side = 'top' | 'right' | 'bottom' | 'left'
export type Alignment = 'start' | 'end'
export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'

export type Strategy = 'absolute' | 'fixed'

export interface VirtualAnchor {
  getBoundingClientRect(): DOMRect
  /** Overflow/layout ancestor when the reference is not an Element. */
  contextElement?: Element
}

export type ReferenceType = HTMLElement | VirtualAnchor

export interface ComputePositionOptions {
  placement?: Placement
  previousPlacement?: Placement
  strategy?: Strategy
  offset?: number
  collisionPadding?: number
  flip?: boolean
  shift?: boolean
  boundary?: ReferenceType | DOMRect | null | 'viewport'
  fallbackPlacements?: Placement[]
  arrow?: {
    element: HTMLElement | null
    edgePadding?: number
  }
}

export interface ComputePositionReturn {
  x: number
  y: number
  placement: Placement
  strategy: Strategy
  middlewareData: {
    arrow?: {
      x?: number
      y?: number
      centerOffset: number
    }
    hide?: {
      referenceHidden?: boolean
      escaped?: boolean
    }
    size?: {
      availableWidth: number
      availableHeight: number
      anchorWidth: number
      anchorHeight: number
    }
    shift?: {
      x: number
      y: number
    }
  }
}

function getSide(placement: Placement): Side {
  return placement.split('-')[0] as Side
}

function getAlignment(placement: Placement): Alignment | undefined {
  return placement.split('-')[1] as Alignment | undefined
}

export function computeCoordsFromPlacement(
  referenceRect: DOMRect,
  floatingRect: DOMRect,
  placement: Placement,
  rtl = false
): { x: number; y: number } {
  const side = getSide(placement)
  const alignment = getAlignment(placement)
  const isVertical = side === 'top' || side === 'bottom'

  let x = 0
  let y = 0

  if (isVertical) {
    y = side === 'top' ? referenceRect.top - floatingRect.height : referenceRect.bottom
    if (!alignment) {
      x = referenceRect.left + (referenceRect.width - floatingRect.width) / 2
    } else if (alignment === 'start') {
      x = rtl ? referenceRect.right - floatingRect.width : referenceRect.left
    } else {
      x = rtl ? referenceRect.left : referenceRect.right - floatingRect.width
    }
  } else {
    x = side === 'left' ? referenceRect.left - floatingRect.width : referenceRect.right
    if (!alignment) {
      y = referenceRect.top + (referenceRect.height - floatingRect.height) / 2
    } else if (alignment === 'start') {
      y = referenceRect.top
    } else {
      y = referenceRect.bottom - floatingRect.height
    }
  }

  return { x, y }
}

function isRtl(el: HTMLElement): boolean {
  const win = el.ownerDocument.defaultView
  if (win?.getComputedStyle(el).direction === 'rtl') return true
  return el.ownerDocument.documentElement.dir === 'rtl'
}

function transformOrigin(placement: Placement, rtl = false): string {
  const side = getSide(placement)
  const alignment = getAlignment(placement) ?? 'center'
  const align =
    alignment === 'start' ? (rtl ? '100%' : '0') : alignment === 'end' ? (rtl ? '0' : '100%') : '50%'
  switch (side) {
    case 'top':
      return `${align} 100%`
    case 'bottom':
      return `${align} 0`
    case 'left':
      return `100% ${align}`
    case 'right':
      return `0 ${align}`
  }
}

export function computePosition(
  reference: ReferenceType,
  floating: HTMLElement,
  options: ComputePositionOptions = {}
): ComputePositionReturn {
  const {
    placement: initialPlacement = 'bottom-start',
    previousPlacement,
    strategy = 'absolute',
    offset = 8,
    collisionPadding = 8,
    flip = true,
    shift = true,
    boundary,
    fallbackPlacements,
    arrow,
  } = options

  const referenceRect = reference.getBoundingClientRect()
  const floatingRect = floating.getBoundingClientRect()
  const win = floating.ownerDocument.defaultView ?? window
  const viewportWidth = win.innerWidth
  const viewportHeight = win.innerHeight
  const rtl = isRtl(floating)

  let boundaryRect: DOMRect
  if (boundary && boundary !== 'viewport') {
    if ('getBoundingClientRect' in boundary && typeof boundary.getBoundingClientRect === 'function') {
      boundaryRect = boundary.getBoundingClientRect()
    } else if (
      typeof (boundary as DOMRect).top === 'number' &&
      typeof (boundary as DOMRect).bottom === 'number' &&
      typeof (boundary as DOMRect).left === 'number' &&
      typeof (boundary as DOMRect).right === 'number'
    ) {
      boundaryRect = boundary as DOMRect
    } else {
      boundaryRect = new DOMRect(0, 0, viewportWidth, viewportHeight)
    }
  } else {
    boundaryRect = new DOMRect(0, 0, viewportWidth, viewportHeight)
  }

  const boundTop = boundaryRect.top + collisionPadding
  const boundBottom = boundaryRect.bottom - collisionPadding
  const boundLeft = boundaryRect.left + collisionPadding
  const boundRight = boundaryRect.right - collisionPadding

  let currentPlacement = previousPlacement ?? initialPlacement
  let side = getSide(currentPlacement)
  const alignment = getAlignment(currentPlacement) ?? getAlignment(initialPlacement)

  const fitsPlacement = (s: Side) => {
    if (s === 'top') {
      return referenceRect.top - floatingRect.height - offset >= boundTop
    }
    if (s === 'bottom') {
      return referenceRect.bottom + floatingRect.height + offset <= boundBottom
    }
    if (s === 'left') {
      return referenceRect.left - floatingRect.width - offset >= boundLeft
    }
    if (s === 'right') {
      return referenceRect.right + floatingRect.width + offset <= boundRight
    }
    return false
  }

  if (flip) {
    if (fallbackPlacements && fallbackPlacements.length > 0) {
      const candidates = [initialPlacement, ...fallbackPlacements]
      let chosen = candidates[0]
      for (const cand of candidates) {
        if (fitsPlacement(getSide(cand))) {
          chosen = cand
          break
        }
      }
      currentPlacement = chosen
      side = getSide(currentPlacement)
    } else {
      const isVertical = side === 'top' || side === 'bottom'
      if (isVertical) {
        if (side === 'top') {
          const overflows = referenceRect.top - floatingRect.height - offset < boundTop
          const fits = fitsPlacement('bottom')
          if (overflows && fits) {
            side = 'bottom'
            currentPlacement = alignment ? (`${side}-${alignment}` as Placement) : side
          }
        } else if (side === 'bottom') {
          const overflows = referenceRect.bottom + floatingRect.height + offset > boundBottom
          const fits = fitsPlacement('top')
          if (overflows && fits) {
            side = 'top'
            currentPlacement = alignment ? (`${side}-${alignment}` as Placement) : side
          }
        }
      } else if (side === 'left') {
        const overflows = referenceRect.left - floatingRect.width - offset < boundLeft
        const fits = fitsPlacement('right')
        if (overflows && fits) {
          side = 'right'
          currentPlacement = alignment ? (`${side}-${alignment}` as Placement) : side
        }
      } else if (side === 'right') {
        const overflows = referenceRect.right + floatingRect.width + offset > boundRight
        const fits = fitsPlacement('left')
        if (overflows && fits) {
          side = 'left'
          currentPlacement = alignment ? (`${side}-${alignment}` as Placement) : side
        }
      }
    }
  }

  let { x, y } = computeCoordsFromPlacement(referenceRect, floatingRect, currentPlacement, rtl)

  if (side === 'top') y -= offset
  else if (side === 'bottom') y += offset
  else if (side === 'left') x -= offset
  else x += offset

  const unshiftedX = x
  const unshiftedY = y

  if (shift) {
    const maxShiftX = Math.max(boundLeft, boundRight - floatingRect.width)
    x = Math.max(boundLeft, Math.min(x, maxShiftX))
    const maxShiftY = Math.max(boundTop, boundBottom - floatingRect.height)
    y = Math.max(boundTop, Math.min(y, maxShiftY))
  }

  const nudgedLeft = x - unshiftedX
  const nudgedTop = y - unshiftedY

  if (strategy === 'absolute') {
    x += win.scrollX
    y += win.scrollY
  }

  const floatingClient = new DOMRect(
    strategy === 'absolute' ? x - win.scrollX : x,
    strategy === 'absolute' ? y - win.scrollY : y,
    floatingRect.width,
    floatingRect.height
  )
  const referenceEl =
    'nodeType' in reference && (reference as Node).nodeType === Node.ELEMENT_NODE
      ? (reference as Element)
      : null

  const middlewareData: ComputePositionReturn['middlewareData'] = {
    shift: {
      x: nudgedLeft,
      y: nudgedTop,
    },
    size: {
      availableWidth: Math.max(0, boundaryRect.width - collisionPadding * 2),
      availableHeight: Math.max(0, boundaryRect.height - collisionPadding * 2),
      anchorWidth: referenceRect.width,
      anchorHeight: referenceRect.height,
    },
    hide: {
      referenceHidden: hiddenByClipping(
        referenceRect,
        referenceEl,
        viewportWidth,
        viewportHeight,
        collisionPadding
      ),
      escaped: hiddenByClipping(floatingClient, referenceEl, viewportWidth, viewportHeight, 0),
    },
  }

  if (arrow?.element) {
    const arrowRect = arrow.element.getBoundingClientRect()
    const edgePadding = arrow.edgePadding ?? 4
    const isVertical = side === 'top' || side === 'bottom'
    if (isVertical) {
      const centerX =
        referenceRect.left + referenceRect.width / 2 - (floatingClient.left + arrowRect.width / 2)
      const clampedX = Math.max(
        edgePadding,
        Math.min(
          centerX,
          floatingRect.width - arrowRect.width - edgePadding
        )
      )
      middlewareData.arrow = {
        x: clampedX,
        centerOffset: centerX - clampedX,
      }
    } else {
      const centerY =
        referenceRect.top + referenceRect.height / 2 - (floatingClient.top + arrowRect.height / 2)
      const clampedY = Math.max(
        edgePadding,
        Math.min(
          centerY - arrowRect.height / 2,
          floatingRect.height - arrowRect.height - edgePadding
        )
      )
      middlewareData.arrow = {
        y: clampedY,
        centerOffset: centerY - (clampedY + arrowRect.height / 2),
      }
    }
  }

  floating.style.setProperty(
    '--reference-overlay-transform-origin',
    transformOrigin(currentPlacement, rtl)
  )

  return {
    x,
    y,
    placement: currentPlacement,
    strategy,
    middlewareData,
  }
}

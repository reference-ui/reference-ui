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
}

export type ReferenceType = HTMLElement | VirtualAnchor

export interface ComputePositionOptions {
  placement?: Placement
  strategy?: Strategy
  offset?: number
  collisionPadding?: number
  flip?: boolean
  shift?: boolean
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
  }
}

function getSide(placement: Placement): Side {
  return placement.split('-')[0] as Side
}

function getAlignment(placement: Placement): Alignment | undefined {
  return placement.split('-')[1] as Alignment | undefined
}

function getOppositeSide(side: Side): Side {
  switch (side) {
    case 'top':
      return 'bottom'
    case 'bottom':
      return 'top'
    case 'left':
      return 'right'
    case 'right':
      return 'left'
  }
}

export function computeCoordsFromPlacement(
  referenceRect: DOMRect,
  floatingRect: DOMRect,
  placement: Placement
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
      x = referenceRect.left
    } else if (alignment === 'end') {
      x = referenceRect.right - floatingRect.width
    }
  } else {
    x = side === 'left' ? referenceRect.left - floatingRect.width : referenceRect.right

    if (!alignment) {
      y = referenceRect.top + (referenceRect.height - floatingRect.height) / 2
    } else if (alignment === 'start') {
      y = referenceRect.top
    } else if (alignment === 'end') {
      y = referenceRect.bottom - floatingRect.height
    }
  }

  return { x, y }
}

export function computePosition(
  reference: ReferenceType,
  floating: HTMLElement,
  options: ComputePositionOptions = {}
): ComputePositionReturn {
  const {
    placement: initialPlacement = 'bottom-start',
    strategy = 'absolute',
    offset = 8,
    collisionPadding = 8,
    flip = true,
    shift = true,
    arrow,
  } = options

  const referenceRect = reference.getBoundingClientRect()
  const floatingRect = floating.getBoundingClientRect()

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let currentPlacement = initialPlacement
  let side = getSide(currentPlacement)
  const alignment = getAlignment(currentPlacement)

  // 1. Apply Flip if requested
  if (flip) {
    const isVertical = side === 'top' || side === 'bottom'
    if (isVertical) {
      if (side === 'top' && referenceRect.top - floatingRect.height - offset < collisionPadding) {
        if (referenceRect.bottom + floatingRect.height + offset <= viewportHeight - collisionPadding) {
          side = 'bottom'
          currentPlacement = alignment ? `${side}-${alignment}` as Placement : side
        }
      } else if (side === 'bottom' && referenceRect.bottom + floatingRect.height + offset > viewportHeight - collisionPadding) {
        if (referenceRect.top - floatingRect.height - offset >= collisionPadding) {
          side = 'top'
          currentPlacement = alignment ? `${side}-${alignment}` as Placement : side
        }
      }
    } else {
      if (side === 'left' && referenceRect.left - floatingRect.width - offset < collisionPadding) {
        if (referenceRect.right + floatingRect.width + offset <= viewportWidth - collisionPadding) {
          side = 'right'
          currentPlacement = alignment ? `${side}-${alignment}` as Placement : side
        }
      } else if (side === 'right' && referenceRect.right + floatingRect.width + offset > viewportWidth - collisionPadding) {
        if (referenceRect.left - floatingRect.width - offset >= collisionPadding) {
          side = 'left'
          currentPlacement = alignment ? `${side}-${alignment}` as Placement : side
        }
      }
    }
  }

  // 2. Base Coords
  let { x, y } = computeCoordsFromPlacement(referenceRect, floatingRect, currentPlacement)

  // 3. Apply Offset
  if (side === 'top') {
    y -= offset
  } else if (side === 'bottom') {
    y += offset
  } else if (side === 'left') {
    x -= offset
  } else if (side === 'right') {
    x += offset
  }

  // 4. Apply Shift
  if (shift) {
    x = Math.max(collisionPadding, Math.min(x, viewportWidth - floatingRect.width - collisionPadding))
    y = Math.max(collisionPadding, Math.min(y, viewportHeight - floatingRect.height - collisionPadding))
  }

  // 5. Account for absolute positioning relative to document scroll if not fixed
  if (strategy === 'absolute') {
    x += window.scrollX
    y += window.scrollY
  }

  // 6. Arrow calculations
  const middlewareData: ComputePositionReturn['middlewareData'] = {
    size: {
      availableWidth: Math.max(0, viewportWidth - collisionPadding * 2),
      availableHeight: Math.max(0, viewportHeight - collisionPadding * 2),
      anchorWidth: referenceRect.width,
      anchorHeight: referenceRect.height,
    },
  }

  if (arrow && arrow.element) {
    const arrowEl = arrow.element
    const arrowRect = arrowEl.getBoundingClientRect()
    const edgePadding = arrow.edgePadding ?? 4

    const isVertical = side === 'top' || side === 'bottom'
    if (isVertical) {
      const centerX = referenceRect.left + referenceRect.width / 2 - (strategy === 'absolute' ? x - window.scrollX : x)
      const clampedX = Math.max(
        edgePadding,
        Math.min(centerX - arrowRect.width / 2, floatingRect.width - arrowRect.width - edgePadding)
      )
      middlewareData.arrow = {
        x: clampedX,
        centerOffset: centerX - (clampedX + arrowRect.width / 2),
      }
    } else {
      const centerY = referenceRect.top + referenceRect.height / 2 - (strategy === 'absolute' ? y - window.scrollY : y)
      const clampedY = Math.max(
        edgePadding,
        Math.min(centerY - arrowRect.height / 2, floatingRect.height - arrowRect.height - edgePadding)
      )
      middlewareData.arrow = {
        y: clampedY,
        centerOffset: centerY - (clampedY + arrowRect.height / 2),
      }
    }
  }

  return {
    x,
    y,
    placement: currentPlacement,
    strategy,
    middlewareData,
  }
}

export function getOverflowAncestors(node: Node): Array<Element | Window> {
  const list: Array<Element | Window> = []
  let current: Node | null = node.parentNode

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const element = current as Element
    const style = window.getComputedStyle(element)
    const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`

    if (/auto|scroll|overlay|hidden/.test(overflow)) {
      list.push(element)
    }
    current = current.parentNode
  }

  list.push(window)
  return list
}

export function autoUpdate(
  reference: ReferenceType,
  floating: HTMLElement,
  update: () => void,
  options: { closeOnScroll?: boolean; onScrollClose?: () => void } = {}
): () => void {
  update()

  const handleResize = () => update()
  const handleScroll = () => {
    if (options.closeOnScroll) {
      options.onScrollClose?.()
    } else {
      update()
    }
  }

  window.addEventListener('resize', handleResize)

  let ancestors: Array<Element | Window> = []
  if ('nodeType' in reference && reference.nodeType === Node.ELEMENT_NODE) {
    ancestors = getOverflowAncestors(reference as Element)
    ancestors.forEach((anc) => anc.addEventListener('scroll', handleScroll, { passive: true }))
  } else {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => update())
    : null

  if (resizeObserver) {
    if ('nodeType' in reference && reference.nodeType === Node.ELEMENT_NODE) {
      resizeObserver.observe(reference as Element)
    }
    resizeObserver.observe(floating)
  }

  return () => {
    window.removeEventListener('resize', handleResize)
    if (ancestors.length > 0) {
      ancestors.forEach((anc) => anc.removeEventListener('scroll', handleScroll))
    } else {
      window.removeEventListener('scroll', handleScroll)
    }
    resizeObserver?.disconnect()
  }
}

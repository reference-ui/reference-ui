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
  previousPlacement?: Placement
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
    } else {
      x = referenceRect.right - floatingRect.width
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

function transformOrigin(placement: Placement): string {
  const side = getSide(placement)
  const alignment = getAlignment(placement) ?? 'center'
  const align = alignment === 'start' ? '0' : alignment === 'end' ? '100%' : '50%'
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

function rectHidden(rect: DOMRect, vw: number, vh: number, pad: number): boolean {
  return (
    rect.bottom < pad ||
    rect.top > vh - pad ||
    rect.right < pad ||
    rect.left > vw - pad
  )
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
    arrow,
  } = options

  const referenceRect = reference.getBoundingClientRect()
  const floatingRect = floating.getBoundingClientRect()
  const win = floating.ownerDocument.defaultView ?? window
  const viewportWidth = win.innerWidth
  const viewportHeight = win.innerHeight

  let currentPlacement = previousPlacement ?? initialPlacement
  let side = getSide(currentPlacement)
  const alignment = getAlignment(currentPlacement) ?? getAlignment(initialPlacement)

  if (flip) {
    const isVertical = side === 'top' || side === 'bottom'
    if (isVertical) {
      if (side === 'top') {
        const overflows = referenceRect.top - floatingRect.height - offset < collisionPadding
        const fits =
          referenceRect.bottom + floatingRect.height + offset <=
          viewportHeight - collisionPadding
        if (overflows && fits) {
          side = 'bottom'
          currentPlacement = alignment ? (`${side}-${alignment}` as Placement) : side
        }
      } else if (side === 'bottom') {
        const overflows =
          referenceRect.bottom + floatingRect.height + offset > viewportHeight - collisionPadding
        const fits = referenceRect.top - floatingRect.height - offset >= collisionPadding
        if (overflows && fits) {
          side = 'top'
          currentPlacement = alignment ? (`${side}-${alignment}` as Placement) : side
        }
      }
    } else if (side === 'left') {
      const overflows = referenceRect.left - floatingRect.width - offset < collisionPadding
      const fits =
        referenceRect.right + floatingRect.width + offset <= viewportWidth - collisionPadding
      if (overflows && fits) {
        side = 'right'
        currentPlacement = alignment ? (`${side}-${alignment}` as Placement) : side
      }
    } else if (side === 'right') {
      const overflows =
        referenceRect.right + floatingRect.width + offset > viewportWidth - collisionPadding
      const fits = referenceRect.left - floatingRect.width - offset >= collisionPadding
      if (overflows && fits) {
        side = 'left'
        currentPlacement = alignment ? (`${side}-${alignment}` as Placement) : side
      }
    }
  }

  let { x, y } = computeCoordsFromPlacement(referenceRect, floatingRect, currentPlacement)

  if (side === 'top') y -= offset
  else if (side === 'bottom') y += offset
  else if (side === 'left') x -= offset
  else x += offset

  if (shift) {
    x = Math.max(
      collisionPadding,
      Math.min(x, viewportWidth - floatingRect.width - collisionPadding)
    )
    y = Math.max(
      collisionPadding,
      Math.min(y, viewportHeight - floatingRect.height - collisionPadding)
    )
  }

  if (strategy === 'absolute') {
    x += win.scrollX
    y += win.scrollY
  }

  const middlewareData: ComputePositionReturn['middlewareData'] = {
    size: {
      availableWidth: Math.max(0, viewportWidth - collisionPadding * 2),
      availableHeight: Math.max(0, viewportHeight - collisionPadding * 2),
      anchorWidth: referenceRect.width,
      anchorHeight: referenceRect.height,
    },
    hide: {
      referenceHidden: rectHidden(referenceRect, viewportWidth, viewportHeight, collisionPadding),
      escaped: rectHidden(
        new DOMRect(strategy === 'absolute' ? x - win.scrollX : x, strategy === 'absolute' ? y - win.scrollY : y, floatingRect.width, floatingRect.height),
        viewportWidth,
        viewportHeight,
        0
      ),
    },
  }

  if (arrow?.element) {
    const arrowRect = arrow.element.getBoundingClientRect()
    const edgePadding = arrow.edgePadding ?? 4
    const isVertical = side === 'top' || side === 'bottom'
    if (isVertical) {
      const centerX =
        referenceRect.left +
        referenceRect.width / 2 -
        (strategy === 'absolute' ? x - win.scrollX : x)
      const clampedX = Math.max(
        edgePadding,
        Math.min(
          centerX - arrowRect.width / 2,
          floatingRect.width - arrowRect.width - edgePadding
        )
      )
      middlewareData.arrow = {
        x: clampedX,
        centerOffset: centerX - (clampedX + arrowRect.width / 2),
      }
    } else {
      const centerY =
        referenceRect.top +
        referenceRect.height / 2 -
        (strategy === 'absolute' ? y - win.scrollY : y)
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
    transformOrigin(currentPlacement)
  )

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
    const style = element.ownerDocument.defaultView?.getComputedStyle(element)
    if (style) {
      const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`
      if (/auto|scroll|overlay|hidden/.test(overflow)) list.push(element)
    }
    current = current.parentNode
  }

  const win = node instanceof Element ? node.ownerDocument.defaultView : window
  if (win) list.push(win)
  return list
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function autoUpdate(
  reference: ReferenceType,
  floating: HTMLElement,
  update: () => void,
  options: { closeOnScroll?: boolean; onScrollClose?: () => void } = {}
): () => void {
  update()

  const win = floating.ownerDocument.defaultView ?? window
  const handleResize = () => update()
  const handleScroll = (event: Event) => {
    if (isEditableTarget(event.target)) return
    if (options.closeOnScroll) {
      options.onScrollClose?.()
    } else {
      update()
    }
  }

  win.addEventListener('resize', handleResize)

  let ancestors: Array<Element | Window> = []
  if ('nodeType' in reference && reference.nodeType === Node.ELEMENT_NODE) {
    ancestors = getOverflowAncestors(reference as Element)
    ancestors.forEach(anc => anc.addEventListener('scroll', handleScroll, { passive: true }))
  } else {
    win.addEventListener('scroll', handleScroll, { passive: true })
  }

  const vv = win.visualViewport
  vv?.addEventListener('resize', handleResize)
  vv?.addEventListener('scroll', handleResize)

  const resizeObserver =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => update()) : null

  if (resizeObserver) {
    if ('nodeType' in reference && reference.nodeType === Node.ELEMENT_NODE) {
      resizeObserver.observe(reference as Element)
    }
    resizeObserver.observe(floating)
  }

  return () => {
    win.removeEventListener('resize', handleResize)
    if (ancestors.length > 0) {
      ancestors.forEach(anc => anc.removeEventListener('scroll', handleScroll))
    } else {
      win.removeEventListener('scroll', handleScroll)
    }
    vv?.removeEventListener('resize', handleResize)
    vv?.removeEventListener('scroll', handleResize)
    resizeObserver?.disconnect()
  }
}

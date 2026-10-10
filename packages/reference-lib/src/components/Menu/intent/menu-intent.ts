/**
 * Menu pointer intent geometry and grace polygon calculations.
 * Ports converged Zag intentPolygon / Radix pointerGraceIntent / React Aria safe-triangle behavior.
 * Frozen constants: 100ms open delay, 300ms close delay, 5px grace padding.
 */

export type Side = 'top' | 'right' | 'bottom' | 'left'

export interface RectLike {
  x: number
  y: number
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

export type Point = readonly [number, number]

export const SUBMENU_SAFE_PADDING = 5
export const SUBMENU_OPEN_DELAY_MS = 100
export const SUBMENU_CLOSE_DELAY_MS = 300

export function asRect(rect: DOMRect | RectLike | null | undefined): RectLike {
  if (!rect) {
    return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }
  }
  return {
    x: rect.x ?? rect.left ?? 0,
    y: rect.y ?? rect.top ?? 0,
    width: Math.max(0, rect.width ?? 0),
    height: Math.max(0, rect.height ?? 0),
    top: rect.top ?? rect.y ?? 0,
    right: rect.right ?? ((rect.x ?? rect.left ?? 0) + (rect.width ?? 0)),
    bottom: rect.bottom ?? ((rect.y ?? rect.top ?? 0) + (rect.height ?? 0)),
    left: rect.left ?? rect.x ?? 0,
  }
}

export function padRect(rect: RectLike, pad: number): RectLike {
  return {
    x: rect.left - pad,
    y: rect.top - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    left: rect.left - pad,
    top: rect.top - pad,
    right: rect.right + pad,
    bottom: rect.bottom + pad,
  }
}

export function pointInRect(x: number, y: number, rect: RectLike, pad = 0): boolean {
  if (rect.width <= 0 && rect.height <= 0 && pad === 0) return false
  return (
    x >= rect.left - pad &&
    x <= rect.right + pad &&
    y >= rect.top - pad &&
    y <= rect.bottom + pad
  )
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false
  const [x, y] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const p1 = polygon[i]
    const p2 = polygon[j]
    if (!p1 || !p2) continue
    const [xi, yi] = p1
    const [xj, yj] = p2

    // Check if point is on horizontal edge
    if (yi === yj && yi === y && x >= Math.min(xi, xj) && x <= Math.max(xi, xj)) {
      return true
    }

    const intersect = yi > y !== yj > y && x <= ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function isReverseTravel(side: Side, dx: number, dy: number): boolean {
  switch (side) {
    case 'right':
      return dx < -0.5
    case 'left':
      return dx > 0.5
    case 'bottom':
      return dy < -0.5
    case 'top':
      return dy > 0.5
    default:
      return false
  }
}

export function buildGracePolygon(
  origin: Point,
  side: Side,
  contentRect: RectLike,
  pad = SUBMENU_SAFE_PADDING
): Point[] {
  const [ox, oy] = origin
  const padded = padRect(contentRect, pad)

  if (padded.width <= 0 || padded.height <= 0) {
    return []
  }

  switch (side) {
    case 'right': {
      // Triangle from origin to the corners of the right-side submenu
      return [
        [ox, oy],
        [padded.left, padded.top],
        [padded.right, padded.top],
        [padded.right, padded.bottom],
        [padded.left, padded.bottom],
      ]
    }
    case 'left': {
      // Triangle to the left-side submenu
      return [
        [ox, oy],
        [padded.right, padded.top],
        [padded.left, padded.top],
        [padded.left, padded.bottom],
        [padded.right, padded.bottom],
      ]
    }
    case 'bottom': {
      return [
        [ox, oy],
        [padded.left, padded.top],
        [padded.right, padded.top],
        [padded.right, padded.bottom],
        [padded.left, padded.bottom],
      ]
    }
    case 'top': {
      return [
        [ox, oy],
        [padded.left, padded.bottom],
        [padded.right, padded.bottom],
        [padded.right, padded.top],
        [padded.left, padded.top],
      ]
    }
  }
}

export type PointerIntentDecision = 'inside' | 'grace' | 'leave'

export interface PointerSample {
  x: number
  y: number
  timestamp?: number
}

export interface IntentEvaluationInput {
  currentPoint: Point
  triggerRect: RectLike
  contentRect: RectLike
  side: Side
  leavePoint?: Point
  prevSample?: PointerSample
  pad?: number
}

export function evaluateSubmenuIntent({
  currentPoint,
  triggerRect,
  contentRect,
  side,
  leavePoint,
  prevSample,
  pad = SUBMENU_SAFE_PADDING,
}: IntentEvaluationInput): PointerIntentDecision {
  const [x, y] = currentPoint

  if (isNaN(x) || isNaN(y)) {
    return 'leave'
  }

  // 1. Direct hit inside trigger (with 5px grace) or content (with 5px grace)
  if (pointInRect(x, y, triggerRect, pad) || pointInRect(x, y, contentRect, pad)) {
    return 'inside'
  }

  // If content rect is empty/zero-size, cannot have a grace polygon
  if (contentRect.width <= 0 || contentRect.height <= 0) {
    return 'leave'
  }

  // 2. Velocity and direction check
  if (prevSample && prevSample.timestamp != null) {
    const dx = x - prevSample.x
    const dy = y - prevSample.y
    if (isReverseTravel(side, dx, dy)) {
      return 'leave'
    }
  }

  // 3. Grace polygon check
  const origin = leavePoint ?? (prevSample ? [prevSample.x, prevSample.y] as Point : null)
  if (!origin) {
    return 'leave'
  }

  const polygon = buildGracePolygon(origin, side, contentRect, pad)
  if (polygon.length >= 3 && pointInPolygon(currentPoint, polygon)) {
    return 'grace'
  }

  return 'leave'
}

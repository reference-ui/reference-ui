/** Placement-aware hover grace: padded rects, trough, cursor triangle, intent. */

import type { Side } from '../Overlay/geometry/floating'

export type RectLike = {
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

/** SPEC freeze: pad Trigger and Content by 5px. */
export const SAFE_AREA_PADDING = 5

/** Floating UI / Base UI cursor-speed threshold (px / ms). */
export const CURSOR_SPEED_THRESHOLD = 0.1

/** Linger inside the triangle without landing starts close. */
export const INTENT_LINGER_MS = 40

const POLYGON_BUFFER = 0.5

export function sideFromPlacement(placement: string | null | undefined): Side {
  const side = placement?.split('-')[0]
  if (side === 'top' || side === 'right' || side === 'bottom' || side === 'left') return side
  return 'bottom'
}

export function resolvedSide(content: HTMLElement | null, fallback: Side = 'bottom'): Side {
  return sideFromPlacement(content?.getAttribute('data-side') ?? fallback)
}

export function asRect(rect: DOMRect | RectLike): RectLike {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  }
}

export function padRect(rect: RectLike, pad: number): RectLike {
  return {
    x: rect.x - pad,
    y: rect.y - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    left: rect.left - pad,
    top: rect.top - pad,
    right: rect.right + pad,
    bottom: rect.bottom + pad,
  }
}

export function pointInRect(x: number, y: number, rect: RectLike, pad = 0): boolean {
  return (
    x >= rect.left - pad &&
    x <= rect.right + pad &&
    y >= rect.top - pad &&
    y <= rect.bottom + pad
  )
}

function pointInAxisAligned(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean {
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const [x, y] = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i] ?? [0, 0]
    const [xj, yj] = polygon[j] ?? [0, 0]
    const intersect = yi >= y !== yj >= y && x <= ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function isOppositeSideLeave(
  side: Side,
  leaveX: number,
  leaveY: number,
  trigger: RectLike
): boolean {
  if (side === 'top' && leaveY >= trigger.bottom - 1) return true
  if (side === 'bottom' && leaveY <= trigger.top + 1) return true
  if (side === 'left' && leaveX >= trigger.right - 1) return true
  if (side === 'right' && leaveX <= trigger.left + 1) return true
  return false
}

export function pointInTrough(
  x: number,
  y: number,
  side: Side,
  trigger: RectLike,
  content: RectLike
): boolean {
  const isFloatingWider = content.width > trigger.width
  const isFloatingTaller = content.height > trigger.height
  const left = (isFloatingWider ? trigger : content).left
  const right = (isFloatingWider ? trigger : content).right
  const top = (isFloatingTaller ? trigger : content).top
  const bottom = (isFloatingTaller ? trigger : content).bottom

  switch (side) {
    case 'top':
      return pointInAxisAligned(x, y, left, trigger.top + 1, right, content.bottom - 1)
    case 'bottom':
      return pointInAxisAligned(x, y, left, content.top + 1, right, trigger.bottom - 1)
    case 'left':
      return pointInAxisAligned(x, y, content.right - 1, bottom, trigger.left + 1, top)
    case 'right':
      return pointInAxisAligned(x, y, trigger.right - 1, bottom, content.left + 1, top)
  }
}

function cursorTriangle(
  leaveX: number,
  leaveY: number,
  side: Side,
  trigger: RectLike,
  content: RectLike,
  buffer = POLYGON_BUFFER
): Point[] {
  const cursorLeaveFromRight = leaveX > content.right - content.width / 2
  const cursorLeaveFromBottom = leaveY > content.bottom - content.height / 2
  const isFloatingWider = content.width > trigger.width
  const isFloatingTaller = content.height > trigger.height

  switch (side) {
    case 'top': {
      const cursorXOffset = isFloatingWider ? buffer / 2 : buffer * 4
      const cursorPointOneX = isFloatingWider
        ? leaveX + cursorXOffset
        : cursorLeaveFromRight
          ? leaveX + cursorXOffset
          : leaveX - cursorXOffset
      const cursorPointTwoX = isFloatingWider
        ? leaveX - cursorXOffset
        : cursorLeaveFromRight
          ? leaveX + cursorXOffset
          : leaveX - cursorXOffset
      const commonYLeft = cursorLeaveFromRight
        ? content.bottom - buffer
        : isFloatingWider
          ? content.bottom - buffer
          : content.top
      const commonYRight = cursorLeaveFromRight
        ? isFloatingWider
          ? content.bottom - buffer
          : content.top
        : content.bottom - buffer
      return [
        [cursorPointOneX, leaveY + buffer + 1],
        [cursorPointTwoX, leaveY + buffer + 1],
        [content.left, commonYLeft],
        [content.right, commonYRight],
      ]
    }
    case 'bottom': {
      const cursorXOffset = isFloatingWider ? buffer / 2 : buffer * 4
      const cursorPointOneX = isFloatingWider
        ? leaveX + cursorXOffset
        : cursorLeaveFromRight
          ? leaveX + cursorXOffset
          : leaveX - cursorXOffset
      const cursorPointTwoX = isFloatingWider
        ? leaveX - cursorXOffset
        : cursorLeaveFromRight
          ? leaveX + cursorXOffset
          : leaveX - cursorXOffset
      const commonYLeft = cursorLeaveFromRight
        ? content.top + buffer
        : isFloatingWider
          ? content.top + buffer
          : content.bottom
      const commonYRight = cursorLeaveFromRight
        ? isFloatingWider
          ? content.top + buffer
          : content.bottom
        : content.top + buffer
      return [
        [cursorPointOneX, leaveY - buffer],
        [cursorPointTwoX, leaveY - buffer],
        [content.left, commonYLeft],
        [content.right, commonYRight],
      ]
    }
    case 'left': {
      const cursorYOffset = isFloatingTaller ? buffer / 2 : buffer * 4
      const cursorPointOneY = isFloatingTaller
        ? leaveY + cursorYOffset
        : cursorLeaveFromBottom
          ? leaveY + cursorYOffset
          : leaveY - cursorYOffset
      const cursorPointTwoY = isFloatingTaller
        ? leaveY - cursorYOffset
        : cursorLeaveFromBottom
          ? leaveY + cursorYOffset
          : leaveY - cursorYOffset
      const commonXTop = cursorLeaveFromBottom
        ? content.right - buffer
        : isFloatingTaller
          ? content.right - buffer
          : content.left
      const commonXBottom = cursorLeaveFromBottom
        ? isFloatingTaller
          ? content.right - buffer
          : content.left
        : content.right - buffer
      return [
        [commonXTop, content.top],
        [commonXBottom, content.bottom],
        [leaveX + buffer + 1, cursorPointOneY],
        [leaveX + buffer + 1, cursorPointTwoY],
      ]
    }
    case 'right': {
      const cursorYOffset = isFloatingTaller ? buffer / 2 : buffer * 4
      const cursorPointOneY = isFloatingTaller
        ? leaveY + cursorYOffset
        : cursorLeaveFromBottom
          ? leaveY + cursorYOffset
          : leaveY - cursorYOffset
      const cursorPointTwoY = isFloatingTaller
        ? leaveY - cursorYOffset
        : cursorLeaveFromBottom
          ? leaveY + cursorYOffset
          : leaveY - cursorYOffset
      const commonXTop = cursorLeaveFromBottom
        ? content.left + buffer
        : isFloatingTaller
          ? content.left + buffer
          : content.right
      const commonXBottom = cursorLeaveFromBottom
        ? isFloatingTaller
          ? content.left + buffer
          : content.right
        : content.left + buffer
      return [
        [leaveX - buffer, cursorPointOneY],
        [leaveX - buffer, cursorPointTwoY],
        [commonXTop, content.top],
        [commonXBottom, content.bottom],
      ]
    }
  }
}

export function pointInCursorTriangle(
  x: number,
  y: number,
  leaveX: number,
  leaveY: number,
  side: Side,
  trigger: RectLike,
  content: RectLike
): boolean {
  return pointInPolygon([x, y], cursorTriangle(leaveX, leaveY, side, trigger, content))
}

export function isReverseTravel(side: Side, dx: number, dy: number): boolean {
  if (side === 'bottom' && dy < -1) return true
  if (side === 'top' && dy > 1) return true
  if (side === 'right' && dx < -1) return true
  if (side === 'left' && dx > 1) return true
  return false
}

export type PointerSafety = 'inside' | 'grace' | 'leave'

export type PointerSafetyInput = {
  x: number
  y: number
  leaveX: number
  leaveY: number
  side: Side
  trigger: RectLike
  content: RectLike
  hasLanded: boolean
  pad?: number
}

export function evaluatePointerSafety({
  x,
  y,
  leaveX,
  leaveY,
  side,
  trigger,
  content,
  hasLanded,
  pad = SAFE_AREA_PADDING,
}: PointerSafetyInput): PointerSafety {
  if (pointInRect(x, y, trigger, pad) || pointInRect(x, y, content, pad)) return 'inside'
  if (isOppositeSideLeave(side, leaveX, leaveY, trigger)) return 'leave'
  if (pointInTrough(x, y, side, trigger, content)) return 'grace'
  if (hasLanded) return 'leave'
  if (pointInCursorTriangle(x, y, leaveX, leaveY, side, trigger, content)) return 'grace'
  return 'leave'
}

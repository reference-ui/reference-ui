import type { OverlayEdge } from './types'

/** Ported from Vaul. Distance as a fraction of the surface, velocity in px/ms. */
export const CLOSE_THRESHOLD = 0.25
export const VELOCITY_THRESHOLD = 0.4

export function dismissDelta(edge: OverlayEdge, dx: number, dy: number): number {
  switch (edge) {
    case 'bottom':
      return Math.max(0, dy)
    case 'top':
      return Math.max(0, -dy)
    case 'right':
      return Math.max(0, dx)
    case 'left':
      return Math.max(0, -dx)
  }
}

export function axisSize(edge: OverlayEdge, width: number, height: number): number {
  return edge === 'left' || edge === 'right' ? width : height
}

export function swipeProgress(delta: number, size: number): number {
  if (size <= 0) return 0
  return Math.min(1, delta / size)
}

export function shouldDismiss(progress: number, velocity: number): boolean {
  return progress >= CLOSE_THRESHOLD || velocity > VELOCITY_THRESHOLD
}

export function swipeTransform(edge: OverlayEdge, delta: number): string {
  switch (edge) {
    case 'bottom':
      return `translateY(${delta}px)`
    case 'top':
      return `translateY(${-delta}px)`
    case 'right':
      return `translateX(${delta}px)`
    case 'left':
      return `translateX(${-delta}px)`
  }
}

export function sampleVelocity(
  history: Array<{ time: number; x: number; y: number }>,
  edge: OverlayEdge
): number {
  const first = history[0]
  const last = history[history.length - 1]
  if (!first || !last) return 0
  const dt = last.time - first.time
  if (dt <= 0) return 0
  return dismissDelta(edge, last.x - first.x, last.y - first.y) / dt
}

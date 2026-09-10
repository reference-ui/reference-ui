/** Shared layout-rect helpers. Overlay autoUpdate is the consumer; Splitter must not poll. */

export interface RectLike {
  left: number
  top: number
  width: number
  height: number
}

/** Sub-pixel jitter ignored when deciding whether a rect moved. */
export const RECT_JITTER_EPSILON = 0.1

export function readClientRect(target: { getBoundingClientRect(): DOMRect }): RectLike {
  const rect = target.getBoundingClientRect()
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

export function rectsDiffer(
  previous: RectLike | null | undefined,
  next: RectLike,
  epsilon = RECT_JITTER_EPSILON
): boolean {
  if (!previous) return true
  return (
    Math.abs(previous.left - next.left) > epsilon ||
    Math.abs(previous.top - next.top) > epsilon ||
    Math.abs(previous.width - next.width) > epsilon ||
    Math.abs(previous.height - next.height) > epsilon
  )
}

export function snapshotRects(
  targets: ReadonlyArray<{ getBoundingClientRect(): DOMRect } | null | undefined>
): RectLike[] {
  const out: RectLike[] = []
  for (const target of targets) {
    if (target && typeof target.getBoundingClientRect === 'function') {
      out.push(readClientRect(target))
    }
  }
  return out
}

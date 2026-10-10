/**
 * Toast stack math: which records mount, how they group by position, and
 * the measured heights behind collapsed and expanded stacks. Shown means
 * the visible FIFO window plus exiting records finishing their animation;
 * offsets accumulate from the front so expansion pushes older toasts out
 * by exactly the measured heights beneath them.
 */
import type { ToastItem, ToastOffset } from '../types'
import { TOAST_WIDTH, visibleToasts } from '../toastQueue'
import { resolveEdgeOffset } from './position'

export const TOAST_STACK_PEEK = 14
export const TOAST_ESTIMATED_HEIGHT = 68

export function shownToasts(toasts: ToastItem[], limit: number): ToastItem[] {
  const active = toasts.filter(item => !item.exiting)
  const shownActive = visibleToasts(active, limit)
  const shownIds = new Set(shownActive.map(item => item.id))
  return toasts.filter(item => shownIds.has(item.id) || item.exiting)
}

export function groupToastsByPosition(
  toasts: ToastItem[],
  fallbackPosition: string
): Map<string, ToastItem[]> {
  const grouped = new Map<string, ToastItem[]>()
  for (const item of toasts) {
    const pos = item.position ?? fallbackPosition
    const list = grouped.get(pos) ?? []
    list.push(item)
    grouped.set(pos, list)
  }
  return grouped
}

export function expandedItemOffsets(
  toasts: ReadonlyArray<{ id: string }>,
  heights: Record<string, number>,
  gap: number
): number[] {
  const totalCount = toasts.length
  const offsets: number[] = new Array(totalCount).fill(0)
  let accumulated = 0
  for (let f = 0; f < totalCount; f++) {
    const actualIdx = totalCount - 1 - f
    offsets[actualIdx] = accumulated
    const h = heights[toasts[actualIdx]?.id] || TOAST_ESTIMATED_HEIGHT
    accumulated += h + gap
  }
  return offsets
}

export function expandedTotalHeight(
  toasts: ReadonlyArray<{ id: string }>,
  heights: Record<string, number>,
  gap: number
): number {
  let sum = 0
  for (const t of toasts) {
    sum += (heights[t.id] || TOAST_ESTIMATED_HEIGHT) + gap
  }
  return sum > 0 ? sum - gap : 0
}

export function collapsedStackHeight(frontHeight: number, count: number): number {
  return frontHeight + (count > 1 ? Math.min(count - 1, 2) * TOAST_STACK_PEEK : 0)
}

export function stackWidth({
  mobile,
  sideAligned,
  activeOffset,
  fallback,
}: {
  mobile: boolean
  sideAligned: boolean
  activeOffset: ToastOffset | undefined
  fallback: string
}): string {
  if (mobile && sideAligned) {
    return `calc(100vw - ${resolveEdgeOffset(activeOffset, 'left', fallback)} - ${resolveEdgeOffset(activeOffset, 'right', fallback)})`
  }
  return `${TOAST_WIDTH}px`
}

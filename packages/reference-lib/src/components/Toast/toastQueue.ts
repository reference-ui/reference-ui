export const LIBRARY_TOAST_DURATION = 5000
export const LIBRARY_TOAST_POSITION = 'bottom-end'
export const LIBRARY_TOAST_LIMIT = 4
export const DEFAULT_TOAST_HOTKEY = ['altKey', 'KeyT'] as const

export const SWIPE_DISTANCE = 75
export const SWIPE_VELOCITY = 0.5

export function visibleToasts<T>(toasts: readonly T[], limit: number): T[] {
  return toasts.slice(0, Math.max(0, limit)) as T[]
}

export function waitingToasts<T>(toasts: readonly T[], limit: number): T[] {
  return toasts.slice(Math.max(0, limit)) as T[]
}

export function remainingAfterElapsed(
  remaining: number | false | undefined,
  elapsedMs: number
): number | false | undefined {
  if (remaining === false || remaining === undefined) return remaining
  return Math.max(0, remaining - elapsedMs)
}

export function shouldAutoDismiss(remaining: number | false | undefined): boolean {
  return remaining !== false && remaining !== undefined && remaining <= 0
}

export function shouldDismissSwipe(distance: number, velocity: number): boolean {
  return distance > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY
}

export type ToastSwipeDirection = 'top' | 'right' | 'bottom' | 'left'

/** Sonner default: swipe toward the screen edge for the occupied position. */
export function defaultSwipeDirections(position: string): ToastSwipeDirection[] {
  const [y, x] = position.split('-')
  const directions: ToastSwipeDirection[] = []
  if (y === 'top') directions.push('top')
  if (y === 'bottom') directions.push('bottom')
  if (x === 'start') directions.push('left')
  else if (x === 'end') directions.push('right')
  else directions.push('left', 'right')
  return directions
}

export function isAllowedSwipe(
  axis: 'x' | 'y',
  amount: number,
  allowed: readonly ToastSwipeDirection[]
): boolean {
  if (axis === 'x') return allowed.includes(amount > 0 ? 'right' : 'left')
  return allowed.includes(amount > 0 ? 'bottom' : 'top')
}

export const TOAST_HISTORY_LIMIT = 100

/** Sonner promise success/error may return `{ message, ...toastOptions }`. */
export function splitPromiseResult(
  value: unknown
): { message: unknown; options: Record<string, unknown> } | null {
  if (value == null || typeof value !== 'object') return null
  if ('$$typeof' in value) return null
  if (!('message' in value)) return null
  const record = value as Record<string, unknown>
  const { message, ...options } = record
  return { message, options }
}

export type OverlayPauseLayer = {
  isModal?: boolean
  isolation?: { inert?: boolean }
  document?: Document | null
}

/** Pause while any isolating Overlay is still on this document's stack (including Presence). */
export function isToastPausedByOverlay(
  layers: readonly OverlayPauseLayer[],
  doc?: Document | null
): boolean {
  return layers.some(layer => {
    if (doc && layer.document && layer.document !== doc) return false
    return Boolean(layer.isModal || layer.isolation?.inert)
  })
}

const MODIFIER_PROPS = {
  altKey: 'altKey',
  ctrlKey: 'ctrlKey',
  metaKey: 'metaKey',
  shiftKey: 'shiftKey',
  Alt: 'altKey',
  Control: 'ctrlKey',
  Meta: 'metaKey',
  Shift: 'shiftKey',
} as const

export function matchesHotkey(
  event: {
    altKey: boolean
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    code: string
    key: string
  },
  hotkey: readonly string[] | false | undefined
): boolean {
  if (!hotkey || hotkey.length === 0) return false
  return hotkey.every(part => {
    const modifier = MODIFIER_PROPS[part as keyof typeof MODIFIER_PROPS]
    if (modifier) return Boolean(event[modifier])
    return event.code === part || event.key === part
  })
}

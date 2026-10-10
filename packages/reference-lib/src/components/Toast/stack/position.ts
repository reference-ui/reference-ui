/**
 * Toast host placement: resolves each stack's fixed-position style from
 * the position slot, edge offsets, and mobile state. Offsets accept a
 * bare number/string for all edges or a per-edge map; center slots drop
 * their translate on mobile so the sheet spans the viewport instead.
 */
import type * as React from 'react'
import type { ToastOffset } from '../types'
import { TOAST_MOBILE_OFFSET, TOAST_OFFSET } from '../toastQueue'

function cssOffset(value: string | number | undefined, fallback: string): string {
  if (value == null) return fallback
  return typeof value === 'number' ? `${value}px` : value
}

export function resolveEdgeOffset(
  offset: ToastOffset | undefined,
  edge: 'top' | 'right' | 'bottom' | 'left',
  fallback: string
): string {
  if (offset == null) return fallback
  if (typeof offset === 'number' || typeof offset === 'string') return cssOffset(offset, fallback)
  return cssOffset(offset[edge], fallback)
}

export function getPositionStyles(
  position: string,
  offset: ToastOffset | undefined,
  fallback: string,
  mobile: boolean
): React.CSSProperties {
  const top = resolveEdgeOffset(offset, 'top', fallback)
  const right = resolveEdgeOffset(offset, 'right', fallback)
  const bottom = resolveEdgeOffset(offset, 'bottom', fallback)
  const left = resolveEdgeOffset(offset, 'left', fallback)
  const dropCenterTranslate = mobile && (position === 'top-center' || position === 'bottom-center')
  switch (position) {
    case 'top-start':
      return { top, left, alignItems: 'flex-start' }
    case 'top-center':
      return {
        top,
        left: dropCenterTranslate ? left : '50%',
        right: dropCenterTranslate ? right : undefined,
        transform: dropCenterTranslate ? undefined : 'translateX(-50%)',
        alignItems: 'center',
      }
    case 'top-end':
      return { top, right, alignItems: 'flex-end' }
    case 'bottom-start':
      return { bottom, left, alignItems: 'flex-start' }
    case 'bottom-center':
      return {
        bottom,
        left: dropCenterTranslate ? left : '50%',
        right: dropCenterTranslate ? right : undefined,
        transform: dropCenterTranslate ? undefined : 'translateX(-50%)',
        alignItems: 'center',
      }
    case 'bottom-end':
    default:
      return { bottom, right, alignItems: 'flex-end' }
  }
}

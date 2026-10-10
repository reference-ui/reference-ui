/**
 * Toast item presentation: the absolute-positioned card style from stack
 * geometry and interaction state. Collapsed toasts peek behind the front
 * by a fixed step and shrink toward a floor; expanded toasts sit at their
 * measured offsets full-scale. Drag offsets, enter transitions, focus
 * rings, and pointer gating all fold into the custom-property contract
 * the host stylesheet animates.
 */
import type * as React from 'react'
import { TOAST_SCALE_STEP } from '../toastQueue'
import { TOAST_STACK_PEEK } from './layout'

export const TOAST_SCALE_FLOOR = 0.85

export interface ToastItemGeometry {
  index: number
  totalCount: number
  frontOffset: number
  expandedOffset: number
  isExpanded: boolean
  isTop: boolean
  entered: boolean
  reducedMotion: boolean
  isDragging: boolean
  isFocused: boolean
  dragOffset: { x: number; y: number }
  dataState: 'open' | 'closed'
  swipeOut: boolean
  dismissible: boolean
  swipeLocked: boolean
}

export function toastItemStyle(g: ToastItemGeometry): React.CSSProperties {
  const stackedY = g.isTop ? g.frontOffset * TOAST_STACK_PEEK : -g.frontOffset * TOAST_STACK_PEEK
  const expandedY = g.isTop ? g.expandedOffset : -g.expandedOffset
  const y = g.isExpanded ? expandedY : stackedY
  const scale = g.isExpanded ? 1 : Math.max(TOAST_SCALE_FLOOR, 1 - g.frontOffset * TOAST_SCALE_STEP)
  const zIndex = g.totalCount - g.frontOffset
  return {
    pointerEvents: (!g.entered && !g.reducedMotion) || (g.frontOffset > 2 && !g.isExpanded) ? 'none' : 'auto',
    position: 'absolute',
    bottom: !g.isTop ? 0 : undefined,
    top: g.isTop ? 0 : undefined,
    left: 0,
    right: 0,
    touchAction: 'none',
    zIndex,
    cursor: g.dismissible && !g.swipeLocked ? (g.isDragging ? 'grabbing' : 'grab') : 'default',
    userSelect: 'none',
    transition: g.reducedMotion || g.isDragging ? 'none' : undefined,
    animation: g.reducedMotion ? 'none' : undefined,
    outline: g.isFocused ? '2px solid var(--reference-toast-focus, #171717)' : undefined,
    outlineOffset: g.isFocused ? '2px' : undefined,
    ['--reference-toast-index' as string]: `${g.index}`,
    ['--reference-toast-count' as string]: `${g.totalCount}`,
    ['--reference-toast-offset' as string]: `${y}px`,
    ['--reference-toast-scale' as string]: `${scale}`,
    ['--reference-toast-swipe-x' as string]: `${g.dragOffset.x}px`,
    ['--reference-toast-swipe-y' as string]: `${g.dragOffset.y}px`,
    ['--reference-toast-enter' as string]:
      g.dataState === 'closed' && !g.swipeOut ? (g.isTop ? '-100%' : '100%') : '0px',
    ['--reference-toast-origin' as string]: g.isTop ? 'top center' : 'bottom center',
  }
}

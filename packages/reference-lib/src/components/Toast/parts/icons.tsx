/**
 * Toast type icons: the success, error, warning, and info glyphs with
 * their token-driven strokes. typeIcon resolves a toast type to its
 * glyph, preferring caller overrides from the item context; loading
 * and default render no glyph so the loader or bare card shows.
 */
import * as React from 'react'
import type { ToastIcons, ToastType } from '../types'

function SuccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--colors-green-500, #10b981)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--colors-red-500, #ef4444)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--colors-amber-500, #f59e0b)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--colors-blue-500, #3b82f6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function typeIcon(type: ToastType, icons?: ToastIcons) {
  switch (type) {
    case 'success':
      return icons?.success ?? <SuccessIcon />
    case 'error':
      return icons?.error ?? <ErrorIcon />
    case 'warning':
      return icons?.warning ?? <WarningIcon />
    case 'info':
      return icons?.info ?? <InfoIcon />
    default:
      return null
  }
}

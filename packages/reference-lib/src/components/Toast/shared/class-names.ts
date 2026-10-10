/**
 * Toast class-name layering: host-level overrides spread first so the
 * per-toast record wins each slot. Returns undefined when neither side
 * provides names, keeping the data attributes clean for unstyled toasts.
 */
import type { ToastClassNames } from '../types'

export function mergeClassNames(
  toaster?: ToastClassNames,
  toast?: ToastClassNames
): ToastClassNames | undefined {
  if (!toaster && !toast) return undefined
  return { ...toaster, ...toast }
}

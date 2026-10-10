/**
 * Maps the library's `toaster` configuration onto ToastHost props.
 * `resolveToastHostProps` passes every configured default straight through and
 * fills the one library-owned fallback: an omitted hotkey becomes the global
 * `alt+T` dismiss chord, while an explicit `false` survives untouched so hosts
 * can run hotkey-free. Pure data in, props object out — no JSX, no store.
 */
import type * as React from 'react'
import type { ToastHost } from '../../Toast'
import { DEFAULT_TOAST_HOTKEY } from '../../Toast/toastQueue'
import type { ReferenceLibraryToaster } from '../types'

export function resolveToastHostProps(
  toaster: ReferenceLibraryToaster | undefined,
): React.ComponentProps<typeof ToastHost> {
  return {
    limit: toaster?.limit,
    defaultDuration: toaster?.defaultDuration,
    defaultPosition: toaster?.defaultPosition,
    hotkey: toaster?.hotkey ?? DEFAULT_TOAST_HOTKEY,
    expand: toaster?.expand,
    gap: toaster?.gap,
    offset: toaster?.offset,
    closeButton: toaster?.closeButton,
    richColors: toaster?.richColors,
    invert: toaster?.invert,
    theme: toaster?.theme,
    dir: toaster?.dir,
    mobileOffset: toaster?.mobileOffset,
    containerAriaLabel: toaster?.containerAriaLabel,
    icons: toaster?.icons,
    swipeDirections: toaster?.swipeDirections,
    toastOptions: toaster?.toastOptions,
  }
}

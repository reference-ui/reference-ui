/**
 * Toast root: the notification host plus the chrome compound. The host
 * binds its document's store, derives the shown window grouped by
 * position, and renders one stack per occupied slot with the injected
 * stylesheet; the Toast compound assigns the chrome parts for custom
 * trees. Composition only — stores, geometry, and behaviors live below.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { ToastRoot } from './parts/Root'
import { ToastTitle } from './parts/Title'
import { ToastDescription } from './parts/Description'
import { ToastAction } from './parts/Action'
import { ToastCancel } from './parts/Cancel'
import { ToastClose } from './parts/Close'
import { ToastLoader } from './parts/Loader'
import { DefaultToast } from './parts/Default'
import { ToastPositionStack } from './stack/PositionStack'
import { groupToastsByPosition, shownToasts } from './stack/layout'
import { TOAST_GAP } from './toastQueue'
import { TOAST_HOST_STYLES } from './styling/host-styles'
import { referenceToast } from './state/reference'
import {
  LIBRARY_TOAST_DURATION,
  LIBRARY_TOAST_LIMIT,
  LIBRARY_TOAST_POSITION,
} from './toastQueue'
import { DEFAULT_TOAST_HOTKEY } from './toastQueue'
import { resolveDir } from './shared/dir'
import {
  useIsMobile,
  useOutsideFocusTracking,
  usePrefersReducedMotion,
  useToastHotkey,
  useToastStore,
} from './hooks'
import type { ToastDismissReason, ToastHostProps } from './types'

export const Toast = {
  Root: ToastRoot,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Cancel: ToastCancel,
  Close: ToastClose,
  Default: DefaultToast,
  Loader: ToastLoader,
}

export function ToastHost({
  limit = LIBRARY_TOAST_LIMIT,
  defaultDuration = LIBRARY_TOAST_DURATION,
  defaultPosition = LIBRARY_TOAST_POSITION,
  hotkey = DEFAULT_TOAST_HOTKEY,
  expand = false,
  gap = TOAST_GAP,
  offset,
  mobileOffset,
  closeButton,
  richColors,
  invert,
  theme = 'light',
  dir,
  containerAriaLabel = 'Notifications',
  icons,
  swipeDirections,
  toastOptions,
}: ToastHostProps) {
  const store = useToastStore({ defaultDuration, defaultPosition, limit })
  const mobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()
  const resolvedDir = resolveDir(dir)
  const resolvedClose = closeButton ?? toastOptions?.closeButton ?? false

  const onDismiss = React.useCallback((id: string, reason: ToastDismissReason) => {
    referenceToast.dismiss(id, { reason })
  }, [])

  const onExited = React.useCallback((id: string, generation: number) => {
    referenceToast.remove(id, { generation })
  }, [])

  useOutsideFocusTracking()
  useToastHotkey(hotkey)

  const toasts = store?.toasts ?? []
  const shown = shownToasts(toasts, limit)
  const grouped = groupToastsByPosition(shown, LIBRARY_TOAST_POSITION)

  if (!store) return null

  return (
    <Div
      data-reference-toast-host=""
      data-reference-overlay-ignore=""
      data-react-aria-top-layer=""
      data-theme={theme}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      dir={resolvedDir}
      role="region"
      aria-label={containerAriaLabel}
      pointerEvents="none"
    >
      {shown.length > 0 &&
        Array.from(grouped.entries()).map(([pos, items]) => (
          <ToastPositionStack
            key={pos}
            position={pos}
            toasts={items}
            onDismiss={onDismiss}
            onExited={onExited}
            expand={expand}
            gap={gap}
            offset={offset}
            mobileOffset={mobileOffset}
            mobile={mobile}
            closeButton={resolvedClose}
            icons={icons}
            richColors={richColors}
            invert={invert}
            dir={resolvedDir}
            swipeDirections={swipeDirections}
            toasterClassNames={toastOptions?.classNames}
            toasterUnstyled={toastOptions?.unstyled}
            toasterStyle={toastOptions?.style}
            toasterClassName={toastOptions?.className}
          />
        ))}
      <style>{TOAST_HOST_STYLES}</style>
    </Div>
  )
}

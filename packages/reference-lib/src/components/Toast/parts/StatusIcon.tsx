/**
 * Toast status icon: the crossfading glyph slot at a default toast's
 * leading edge. Renders nothing for bare default toasts; otherwise shows
 * the custom icon when provided, the loader while loading, and the type
 * glyph once settled — CSS toggles which layer is visible by data-type.
 */
import * as React from 'react'
import { ToastLoader } from './Loader'
import { typeIcon } from './icons'
import type { ToastIcons, ToastType } from '../types'

export function StatusIcon({
  type,
  customIcon,
  icons,
  iconClassName,
  loaderClassName,
}: {
  type: ToastType
  customIcon?: React.ReactNode
  icons?: ToastIcons
  iconClassName?: string
  loaderClassName?: string
}) {
  const showIcon = customIcon !== undefined || type !== 'default'
  if (!showIcon) return null
  const resolvedTypeIcon = customIcon !== undefined ? customIcon : typeIcon(type, icons)
  const loadingIcon = icons?.loading

  return (
    <div
      data-reference-toast-icon=""
      data-type={type}
      className={iconClassName}
    >
      {loadingIcon ? (
        <div data-reference-toast-loader="" className={loaderClassName}>
          {loadingIcon}
        </div>
      ) : (
        <ToastLoader className={loaderClassName} />
      )}
      <div data-reference-toast-type-icon="">
        {type === 'loading' ? null : resolvedTypeIcon}
      </div>
    </div>
  )
}

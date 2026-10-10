/**
 * Toast loader part: the twelve-bar spinner shown while a toast is in
 * the loading state. Each bar staggers by index through the shared
 * keyframes; CSS crossfades this against the type icon as the toast
 * settles into success or error.
 */
import * as React from 'react'

export function ToastLoader({ className }: { className?: string }) {
  return (
    <div data-reference-toast-loader="" className={className} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} style={{ ['--index' as string]: i }} />
      ))}
    </div>
  )
}

/**
 * Popover content: the floating panel itself. Defaults to the `dialog`
 * role, chains pointer enter/leave and focus in/out with the intent
 * handlers so hovering or tabbing through the panel keeps it open, and
 * renders nothing outside a Popover subtree.
 */
import * as React from 'react'
import { Overlay, useOverlay, type OverlayContentProps } from '../../Overlay'
import { PopoverContext } from '../context'

export type PopoverContentProps = OverlayContentProps

export function PopoverContent({
  children,
  id,
  role = 'dialog',
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: PopoverContentProps) {
  const context = React.useContext(PopoverContext)
  const overlay = useOverlay()
  if (!context) return null

  const contentId = id ?? context.contentId

  return (
    <Overlay.Content
      {...props}
      id={contentId}
      role={role}
      tabIndex={-1}
      onPointerEnter={(e: React.PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(e)
        context.onContentEnter(e)
      }}
      onPointerLeave={(e: React.PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(e)
        context.onContentLeave(e)
      }}
      onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
        onFocus?.(e)
        context.onFocusInside()
      }}
      onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
        onBlur?.(e)
        context.onFocusLeave(
          e.relatedTarget,
          overlay?.triggerRef.current ?? null,
          overlay?.contentRef.current ?? null
        )
      }}
    >
      {children}
    </Overlay.Content>
  )
}

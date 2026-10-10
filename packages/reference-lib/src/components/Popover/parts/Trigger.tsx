/**
 * Popover trigger: the Overlay trigger plus hover/focus intent chaining.
 * Forwards pointer and focus events to the intent handlers from context,
 * resolves blur destinations against the live trigger and content nodes,
 * and points `aria-controls` at the content while open. Defaults
 * `aria-haspopup` to dialog; consumers may override it.
 */
import * as React from 'react'
import { Overlay, useOverlay, type OverlayTriggerProps } from '../../Overlay'
import { PopoverContext } from '../context'

export type PopoverTriggerProps = OverlayTriggerProps

export function PopoverTrigger({
  children,
  id,
  'aria-haspopup': ariaHasPopup = 'dialog',
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onClick,
  onFocus,
  onBlur,
  ...props
}: PopoverTriggerProps) {
  const context = React.useContext(PopoverContext)
  const overlay = useOverlay()

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerEnter?.(e)
    context?.onTriggerEnter(e)
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerLeave?.(e)
    context?.onTriggerLeave(e)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e)
    context?.onTriggerPointerDown(e)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context?.onTriggerClick(e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    onFocus?.(e)
    context?.onTriggerFocus(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    onBlur?.(e)
    context?.onFocusLeave(
      e.relatedTarget,
      overlay?.triggerRef.current ?? null,
      overlay?.contentRef.current ?? null
    )
  }

  return (
    <Overlay.Trigger
      {...props}
      id={id}
      aria-haspopup={ariaHasPopup}
      aria-controls={context?.isOpen ? context.contentId : undefined}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </Overlay.Trigger>
  )
}

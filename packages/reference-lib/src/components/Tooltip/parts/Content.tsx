/**
 * Tooltip content: the floating tip itself. Defaults to the `tooltip`
 * role, top placement, and the dark mini-chrome, chains pointer
 * enter/leave with the intent handlers so hovering the tip keeps it open,
 * and renders nothing outside a Tooltip subtree.
 */
import * as React from 'react'
import { Overlay, type OverlayContentProps, type OverlayPlacement } from '../../Overlay'
import { TooltipContext } from '../context'

export type TooltipContentProps = OverlayContentProps & {
  /**
   * Side and alignment against the trigger, such as `'top'` or `'bottom-start'`.
   * @default 'top'
   */
  placement?: OverlayPlacement
  /**
   * Distance from the trigger in pixels.
   * @default 8
   */
  offset?: number
  /**
   * Replaces the generated id the trigger points to.
   * @default generated
   */
  id?: string
}

export function TooltipContent({
  children,
  id,
  placement = 'top',
  offset = 8,
  ...props
}: TooltipContentProps) {
  const context = React.useContext(TooltipContext)
  if (!context) return null

  const contentId = id ?? context.contentId

  return (
    <Overlay.Content
      id={contentId}
      role="tooltip"
      placement={placement}
      offset={offset}
      bg="design.primary.background"
      color="design.primary.foreground"
      fontSize="3r"
      lineHeight="4r"
      py="1r"
      px="2.5r"
      borderRadius="sm"
      boxShadow="0 2px 8px rgba(0,0,0,0.2)"
      {...props}
      onPointerEnter={(e: React.PointerEvent<HTMLDivElement>) => {
        props.onPointerEnter?.(e)
        context.onContentEnter(e)
      }}
      onPointerLeave={(e: React.PointerEvent<HTMLDivElement>) => {
        props.onPointerLeave?.(e)
        context.onContentLeave(e)
      }}
    >
      {children}
    </Overlay.Content>
  )
}

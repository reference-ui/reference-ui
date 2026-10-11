/**
 * Popover content: the floating panel itself. Defaults to the `dialog`
 * role, chains pointer enter/leave and focus in/out with the intent
 * handlers so hovering or tabbing through the panel keeps it open,
 * registers an explicit `id` with the owning Popover so the Trigger's
 * `aria-controls` names this node, and renders nothing outside a Popover
 * subtree.
 */
import * as React from 'react'
import { Overlay, useOverlay, type OverlayContentProps } from '../../Overlay'
import { PopoverContext } from '../context'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

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
  const registerContentId = context?.registerContentId

  useIsomorphicLayoutEffect(() => {
    if (id === undefined || !registerContentId) return
    return registerContentId(id)
  }, [id, registerContentId])

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

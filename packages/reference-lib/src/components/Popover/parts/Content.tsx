/**
 * Popover content: the floating panel itself. Defaults to the `dialog`
 * role, chains pointer enter/leave and focus in/out with the intent
 * handlers so hovering or tabbing through the panel keeps it open,
 * registers an explicit `id` with the owning Popover so the Trigger's
 * `aria-controls` names this node, returns focus to `restoreFocus` (the
 * Trigger by default) when closing with focus inside, and renders nothing
 * outside a Popover subtree.
 */
import * as React from 'react'
import { Overlay, useOverlay, type OverlayContentProps, type OverlayPlacement } from '../../Overlay'
import type { FocusTarget } from '../../FocusLock'
import { PopoverContext } from '../context'
import { useCloseRestore } from '../hooks'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

export type PopoverContentProps = OverlayContentProps & {
  /**
   * Side and alignment against the anchor.
   * @default 'bottom-start'
   */
  placement?: OverlayPlacement
  /**
   * Distance from the anchor in pixels.
   * @default 8
   */
  offset?: number
  /**
   * Space kept between Content and the viewport edge.
   * @default 8
   */
  collisionPadding?: number
  /**
   * Move to the opposite side when there is no room.
   * @default true
   */
  flip?: boolean
  /**
   * Slide along the side to stay in view.
   * @default true
   */
  shift?: boolean
  /** Where focus goes when it opens. */
  initialFocus?: FocusTarget | boolean
  /**
   * Where focus returns when it closes with focus inside. `false` leaves focus where it is.
   * @default the trigger
   */
  restoreFocus?: boolean | FocusTarget
  /**
   * The content's role.
   * @default 'dialog'
   */
  role?: string
  /**
   * Replaces the generated id the trigger points to.
   * @default generated
   */
  id?: string
}

export function PopoverContent({
  children,
  id,
  role = 'dialog',
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  restoreFocus,
  ...props
}: PopoverContentProps) {
  const context = React.useContext(PopoverContext)
  const overlay = useOverlay()
  const registerContentId = context?.registerContentId

  useIsomorphicLayoutEffect(() => {
    if (id === undefined || !registerContentId) return
    return registerContentId(id)
  }, [id, registerContentId])

  // Overlay's FocusLock owns restore only when isolating; Popover never is.
  useCloseRestore({
    isOpen: context?.isOpen ?? false,
    restoreFocus,
    contentRef: overlay?.contentRef,
    triggerRef: overlay?.triggerRef,
    returnFocus: context?.returnFocus,
  })

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

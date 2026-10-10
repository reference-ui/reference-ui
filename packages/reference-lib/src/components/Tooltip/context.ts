/**
 * Private subtree scoping: Trigger and Content find their owning Tooltip
 * through `TooltipContext`, never through props. Owns the context value
 * shape (open state, content identity, refs, and the intent handlers the
 * intent hook produces) plus the context object the root provides. Group
 * coordination lives in Zustand (`tooltipGroup`), not here.
 */
import * as React from 'react'

export interface TooltipContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  contentId: string
  triggerRef: React.MutableRefObject<HTMLElement | null>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
  cancelIntent: () => void
  onTriggerEnter: (event: React.PointerEvent<HTMLElement>) => void
  onTriggerLeave: (event: React.PointerEvent<HTMLElement>) => void
  onTriggerPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onTriggerFocus: (event: React.FocusEvent<HTMLElement>) => void
  onTriggerBlur: (event: React.FocusEvent<HTMLElement>) => void
  onContentEnter: (event: React.PointerEvent<HTMLDivElement>) => void
  onContentLeave: (event: React.PointerEvent<HTMLDivElement>) => void
}

export const TooltipContext = React.createContext<TooltipContextValue | null>(null)

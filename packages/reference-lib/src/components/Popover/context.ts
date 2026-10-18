/**
 * Private subtree scoping: Trigger and Content find their owning Popover
 * through `PopoverContext`, never through props. Owns the context value
 * shape (open state, hover mode, content identity and its explicit-id
 * registration, and the hover/focus handlers the intent hook produces)
 * plus the context object the root provides. Stack coordination lives
 * in Overlay, not here.
 */
import * as React from 'react'

export interface PopoverContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  openOnHover: boolean
  contentId: string
  registerContentId: (id: string) => () => void
  onTriggerEnter: (event: React.PointerEvent<HTMLButtonElement>) => void
  onTriggerLeave: (event: React.PointerEvent<HTMLButtonElement>) => void
  onTriggerPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
  onTriggerClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  onTriggerFocus: (event: React.FocusEvent<HTMLButtonElement>) => void
  onFocusInside: () => void
  onFocusLeave: (
    next: EventTarget | null,
    trigger: HTMLElement | null,
    content: HTMLElement | null
  ) => void
  onContentEnter: (event: React.PointerEvent<HTMLDivElement>) => void
  onContentLeave: (event: React.PointerEvent<HTMLDivElement>) => void
  returnFocus: (target: HTMLElement) => void
}

export const PopoverContext = React.createContext<PopoverContextValue | null>(null)

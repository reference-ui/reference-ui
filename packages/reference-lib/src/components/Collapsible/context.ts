/**
 * Collapsible's private subtree scope: openness and its setter, the disabled
 * flag, the trigger/content linkage ids, the mount default and presence
 * mirrors, and the motion-skip and trigger refs the panel effects share. The
 * root provides it; the trigger, content, and panel consume it. Never
 * re-exported from the root — disclosure state stays inside the component.
 */
import * as React from 'react'

export interface CollapsibleContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  disabled: boolean
  contentId: string
  setContentId: (id: string | null) => void
  accordionItem?: boolean
  skipEnterRef: React.MutableRefObject<boolean>
  /** Armed by beforematch; consumed by the next open (skips enter motion once). */
  skipMotionOnceRef: React.MutableRefObject<boolean>
  /** Root-level default for Content `hiddenUntilFound` (Content prop wins). */
  hiddenUntilFound: boolean
  isContentPresent: boolean
  setIsContentPresent: (present: boolean) => void
  isContentMounted: boolean
  setIsContentMounted: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
}

export const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

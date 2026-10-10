/**
 * Trigger/content linkage decisions: what the trigger exposes about the
 * panel. The trigger links to the mounted content while it is open or still
 * present through exit (CO-DOM-02 & CO-DOM-03), drops the link once Content
 * unmounts or was never authored (CO-DOM-09), and collapses its own bottom
 * border while content shows beneath it.
 */
import type * as React from 'react'

export interface TriggerLinkageInput {
  isOpen: boolean
  isContentPresent: boolean
  isContentMounted: boolean
  contentId: string | undefined
}

export interface TriggerLinkage {
  hideBottomBorder: boolean
  ariaControls: string | undefined
}

export function resolveTriggerLinkage({
  isOpen,
  isContentPresent,
  isContentMounted,
  contentId,
}: TriggerLinkageInput): TriggerLinkage {
  const hideBottomBorder = isOpen || isContentPresent

  // CO-DOM-02 & CO-DOM-03: link open trigger to mounted content, keep during exit, remove after unmount
  // CO-DOM-09: no dangling aria-controls if Content is absent
  const hasTarget = isContentMounted && (isOpen || isContentPresent)
  const ariaControls = hasTarget ? contentId : undefined

  return { hideBottomBorder, ariaControls }
}

export function resolveTriggerStyle({
  hideBottomBorder,
  style,
}: {
  hideBottomBorder: boolean
  style: React.CSSProperties | undefined
}): React.CSSProperties | undefined {
  if (!hideBottomBorder || !style) return style
  return {
    ...style,
    borderBottomWidth: 0,
    borderBottomStyle: 'none' as const,
  }
}

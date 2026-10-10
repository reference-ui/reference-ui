/**
 * Closed-content isolation decisions: how the panel hides while it exits.
 * Visually exiting content turns inert, hides from assistive tech, and drops
 * pointer events (CO-PRES-08), restoring only the isolation it owns — while
 * force-mount-alone content stays fully interactive when closed and author
 * inert/aria-hidden pass straight through.
 */
import type * as React from 'react'

export interface ContentIsolationInput {
  isOpen: boolean
  forceMountAlone: boolean
  userInert: boolean | undefined
  userAriaHidden: boolean | 'true' | 'false' | undefined
  style: React.CSSProperties | undefined
}

export interface ContentIsolation {
  isInert: boolean
  isAriaHidden: boolean | 'true' | 'false' | undefined
  contentStyle: React.CSSProperties
}

export function resolveContentIsolation({
  isOpen,
  forceMountAlone,
  userInert,
  userAriaHidden,
  style,
}: ContentIsolationInput): ContentIsolation {
  // CO-PRES-08: isolate visually exiting closed Content, restore only isolation it owns.
  // CO-MOUNT: forceMount-alone closed content stays interactive (no inert,
  // no aria-hidden, no pointer-events kill).
  const closedHidden = !isOpen && !forceMountAlone
  const isInert = closedHidden || Boolean(userInert)
  const isAriaHidden = closedHidden ? 'true' : userAriaHidden
  const contentStyle: React.CSSProperties = {
    ...style,
    ...(closedHidden ? { pointerEvents: 'none' } : undefined),
  }
  return { isInert, isAriaHidden, contentStyle }
}

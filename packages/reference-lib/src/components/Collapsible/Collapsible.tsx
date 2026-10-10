/**
 * Collapsible root: a transparent disclosure session with no node of its own.
 * The component builds the session — openness, linkage, presence, and motion
 * refs — provides it to the trigger and content parts, and renders only the
 * authored children; the compound aliases attach the parts to the root.
 */
import * as React from 'react'
import type { CollapsibleProps } from './types'
import { CollapsibleContext } from './context'
import { useSession } from './hooks/use-session'
import { CollapsibleTrigger } from './parts/Trigger'
import { CollapsibleContent } from './parts/Content'

export type {
  CollapsibleProps,
  CollapsibleTriggerProps,
  CollapsibleContentProps,
} from './types'
export { CollapsibleTrigger } from './parts/Trigger'
export { CollapsibleContent } from './parts/Content'

export function Collapsible({
  children,
  id,
  open: openProp,
  defaultOpen = false,
  onChange,
  onOpenChange,
  disabled = false,
  hiddenUntilFound = false,
}: CollapsibleProps) {
  const session = useSession({
    id,
    openProp,
    defaultOpen,
    onChange,
    onOpenChange,
    disabled,
    hiddenUntilFound,
  })

  return (
    <CollapsibleContext.Provider value={session}>
      {children}
    </CollapsibleContext.Provider>
  )
}

Collapsible.Trigger = CollapsibleTrigger
Collapsible.Content = CollapsibleContent

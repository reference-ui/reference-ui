/**
 * Content registration: binds the trigger/content linkage atomically with
 * mount. The explicit id (or its absence) and the mounted flag land in one
 * layout effect so trigger and content never disagree, and unmount clears
 * both together (CO-DOM-06).
 */
import * as React from 'react'
import type { CollapsibleContextValue } from '../context'

export interface ContentRegistrationOptions {
  context: CollapsibleContextValue | null
  idProp: string | undefined
}

export function useContentRegistration({ context, idProp }: ContentRegistrationOptions): void {
  // CO-DOM-06: register linkage atomically with mount so trigger and content never disagree
  React.useLayoutEffect(() => {
    if (!context) return
    context.setContentId(idProp ?? null)
    context.setIsContentMounted(true)
    return () => {
      context.setContentId(null)
      context.setIsContentMounted(false)
    }
  }, [idProp, context])
}

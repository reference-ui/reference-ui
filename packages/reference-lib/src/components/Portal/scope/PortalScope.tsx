/**
 * The scope reset every portalled subtree crosses. `PortalScope` breaks the
 * inherited layer scope (`LayerScopeContext` to `false`, so the first
 * Reference primitive at the destination re-stamps `data-layer` instead of
 * borrowing the logical ancestor's) and publishes the destination document
 * (`DocumentContext` from `destinationDocument`, so theme reads follow the
 * physical tree). It renders no DOM of its own — only the two providers —
 * keeping Portal's children-only contract intact.
 */
import * as React from 'react'
import { LayerScopeContext, DocumentContext } from '@reference-ui/react'
import type { PortalContainer } from '../types'
import { destinationDocument } from '../destination/resolve'

export function PortalScope({
  node,
  children,
}: {
  node: PortalContainer
  children: React.ReactNode
}) {
  const destinationDoc = destinationDocument(node)

  return (
    <LayerScopeContext.Provider value={false}>
      <DocumentContext.Provider value={destinationDoc}>
        {children}
      </DocumentContext.Provider>
    </LayerScopeContext.Provider>
  )
}

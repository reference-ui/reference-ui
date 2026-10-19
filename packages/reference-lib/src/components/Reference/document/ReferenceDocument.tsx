/**
 * Reference document dispatcher: renders one indexed document through its
 * kind-specific renderer. Takes the document payload; header, interface,
 * and type shapes each get their own presentation below.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { ReferenceDocument as ReferenceDocumentData } from '@reference-ui/types'
import { ReferenceInterface } from './ReferenceInterface'
import { ReferenceType } from './ReferenceType'

/**
 * Document route: dispatches to the first-class document renderer for each kind.
 */
export function ReferenceDocument({ document }: { document: ReferenceDocumentData }) {
  return (
    <Div display="grid" gap="4r">
      {document.kind === 'typeAlias' ? (
        <ReferenceType document={document} />
      ) : (
        <ReferenceInterface document={document} />
      )}
    </Div>
  )
}

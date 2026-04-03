// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/document/ReferenceDocument.tsx
import { Div } from '@reference-ui/react'
import type { ReferenceDocument as ReferenceDocumentData } from '../types'
import { ReferenceInterface } from './ReferenceInterface'
import { ReferenceType } from './ReferenceType'

/**
 * Document route: dispatches to the first-class document renderer for each kind.
 */
export function ReferenceDocument({ document }: { document: ReferenceDocumentData }) {
  return (
    <Div display="grid" gap="reference.lg">
      {document.kind === 'typeAlias' ? (
        <ReferenceType document={document} />
      ) : (
        <ReferenceInterface document={document} />
      )}
    </Div>
  )
}

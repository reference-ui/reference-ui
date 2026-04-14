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

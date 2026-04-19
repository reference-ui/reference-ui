import type { ReferenceDocument } from '@reference-ui/types'
import { Div } from '@reference-ui/react'
import { ReferenceInterface, ReferenceType } from '../document/index'

export function ReferenceDocumentView({ document }: { document: ReferenceDocument }) {
  return (
    <Div display="grid" gap="4r">
      {document.kind === 'typeAlias'
        ? <ReferenceType document={document} />
        : <ReferenceInterface document={document} />}
    </Div>
  )
}

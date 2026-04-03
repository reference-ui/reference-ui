// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/ReferenceDocumentView.tsx
import type { ReferenceDocument } from '../types'
import { Div } from '@reference-ui/react'
import { ReferenceInterface, ReferenceType } from '../document/index'

export function ReferenceDocumentView({ document }: { document: ReferenceDocument }) {
  return (
    <Div display="grid" gap="reference.lg">
      {document.kind === 'typeAlias'
        ? <ReferenceType document={document} />
        : <ReferenceInterface document={document} />}
    </Div>
  )
}

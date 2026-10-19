/**
 * Reference document view: the framed presentation of one indexed
 * document. Takes the document payload and composes the frame with the
 * kind-specific document renderer inside it.
 */
import * as React from 'react'
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

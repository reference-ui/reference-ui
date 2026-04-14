// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/ReferenceDocumentView.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import type { ReferenceDocument } from '../../browser/component-api'
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

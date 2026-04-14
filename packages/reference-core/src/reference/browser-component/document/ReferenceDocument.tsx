// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/document/ReferenceDocument.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Div } from '@reference-ui/react'
import type { ReferenceDocument as ReferenceDocumentData } from '../../browser/component-api'
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

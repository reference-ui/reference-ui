// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/document/ReferenceType.tsx
 * This file is mirrored into reference-core by scripts/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import type { ReferenceDocument as ReferenceDocumentData } from '../../browser/component-api'
import { ReferenceMemberList } from '../components/ReferenceMemberList'
import { ReferenceTypeDefinition } from '../components/ReferenceTypeDefinition'
import { ReferenceDocumentHeader } from './ReferenceDocumentHeader'

/**
 * First-class type document rendering: header plus projected members or the raw type definition.
 */
export function ReferenceType({ document }: { document: ReferenceDocumentData }) {
  return (
    <>
      <ReferenceDocumentHeader document={document} />
      {document.members.length > 0 ? (
        <ReferenceMemberList members={document.members} />
      ) : (
        <ReferenceTypeDefinition definition={document.definition} />
      )}
    </>
  )
}

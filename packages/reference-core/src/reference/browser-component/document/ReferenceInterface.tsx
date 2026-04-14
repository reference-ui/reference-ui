// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/document/ReferenceInterface.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import type { ReferenceDocument as ReferenceDocumentData } from '../../browser/component-api'
import { ReferenceMemberList } from '../components/ReferenceMemberList'
import { ReferenceDocumentHeader } from './ReferenceDocumentHeader'

/**
 * First-class interface document rendering: header plus flattened member surface.
 */
export function ReferenceInterface({ document }: { document: ReferenceDocumentData }) {
  return (
    <>
      <ReferenceDocumentHeader document={document} />
      <ReferenceMemberList members={document.members} />
    </>
  )
}

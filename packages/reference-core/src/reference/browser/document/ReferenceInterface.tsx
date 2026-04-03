// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/document/ReferenceInterface.tsx
import type { ReferenceDocument as ReferenceDocumentData } from '../types'
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

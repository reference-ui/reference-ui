import type { ReferenceDocument as ReferenceDocumentData } from '@reference-ui/types'
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

import type { ReferenceDocument as ReferenceDocumentData } from '@reference-ui/types'
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

import { Div } from '@reference-ui/react'
import type { ReferenceDocument as ReferenceDocumentData } from '@reference-ui/types'
import { ReferenceMemberList } from '../components/ReferenceMemberList.js'
import { ReferenceDocumentHeader } from './ReferenceDocumentHeader.js'
import { ReferenceTypeAlias } from './ReferenceTypeAlias.js'

/**
 * Document route: header + type body or member table.
 */
export function ReferenceDocument({ document }: { document: ReferenceDocumentData }) {
  return (
    <Div display="grid" gap="reference.lg">
      <ReferenceDocumentHeader document={document} />
      {document.kind === 'typeAlias'
        ? document.members.length > 0
          ? <ReferenceMemberList members={document.members} />
          : <ReferenceTypeAlias definition={document.definition} />
        : <ReferenceMemberList members={document.members} />}
    </Div>
  )
}

/**
 * Reference interface renderer: members, JSDoc, and summaries for one
 * indexed interface. Takes the document payload; rows render through the
 * member list, aliases through the type definition.
 */
import * as React from 'react'
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

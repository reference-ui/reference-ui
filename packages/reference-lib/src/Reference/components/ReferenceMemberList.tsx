import { Div, Small } from '@reference-ui/react'
import type { ReferenceMemberDocument } from '@reference-ui/types'
import { ReferenceMemberRow } from './ReferenceMemberRow.js'

export function ReferenceMemberList({ members }: { members: ReferenceMemberDocument[] }) {
  if (members.length === 0) {
    return (
      <Small color="reference.muted">No members were emitted for this interface.</Small>
    )
  }

  return (
    <Div
      css={{
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'reference.border',
      }}
    >
      {members.map(member => (
        <ReferenceMemberRow key={member.id} member={member} />
      ))}
    </Div>
  )
}
;``

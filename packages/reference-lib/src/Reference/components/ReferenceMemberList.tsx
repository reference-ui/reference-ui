import { useState, type ComponentProps, type CSSProperties } from 'react'
import { Div, Small } from '@reference-ui/react'
import type { ReferenceMemberDocument, ReferenceSymbolRef } from '@reference-ui/types'
import { ReferenceMemberRow } from './ReferenceMemberRow'

const memberListCss = {
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'reference.border',
} as ComponentProps<typeof Div>['css']

const inheritedToggleButtonStyle: CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textAlign: 'left' as const,
  width: '100%',
}

type InheritedMemberGroup = {
  origin: ReferenceSymbolRef
  members: ReferenceMemberDocument[]
}

function partitionMembers(members: ReferenceMemberDocument[]) {
  const declaredMembers: ReferenceMemberDocument[] = []
  const inheritedGroupsById = new Map<string, InheritedMemberGroup>()

  for (const member of members) {
    if (!member.inheritedFrom) {
      declaredMembers.push(member)
      continue
    }

    const group = inheritedGroupsById.get(member.inheritedFrom.id)

    if (group) {
      group.members.push(member)
      continue
    }

    inheritedGroupsById.set(member.inheritedFrom.id, {
      origin: member.inheritedFrom,
      members: [member],
    })
  }

  return {
    declaredMembers,
    inheritedGroups: [...inheritedGroupsById.values()],
  }
}

function ReferenceMemberRows({
  members,
  showInheritedFrom = true,
}: {
  members: ReferenceMemberDocument[]
  showInheritedFrom?: boolean
}) {
  return (
    <Div css={memberListCss}>
      {members.map(member => (
        <ReferenceMemberRow
          key={member.id}
          member={member}
          showInheritedFrom={showInheritedFrom}
        />
      ))}
    </Div>
  )
}

function ReferenceInheritedMemberSection({ group }: { group: InheritedMemberGroup }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Div display="grid" gap="reference.sm">
      <button
        type="button"
        onClick={() => setIsExpanded(expanded => !expanded)}
        style={inheritedToggleButtonStyle}
      >
        <Div
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap="reference.sm"
          paddingBlock="reference.sm"
          css={{
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'reference.border',
          }}
        >
          <Small color="reference.muted">
            Inherited from {group.origin.name}
          </Small>
          <Small color="reference.muted">
            {isExpanded
              ? `Hide ${group.members.length} members`
              : `Show ${group.members.length} members`}
          </Small>
        </Div>
      </button>
      {isExpanded ? (
        <ReferenceMemberRows members={group.members} showInheritedFrom={false} />
      ) : null}
    </Div>
  )
}

export function ReferenceMemberList({ members }: { members: ReferenceMemberDocument[] }) {
  if (members.length === 0) {
    return (
      <Small color="reference.muted">No members were emitted for this interface.</Small>
    )
  }

  const { declaredMembers, inheritedGroups } = partitionMembers(members)

  return (
    <Div display="grid" gap="reference.lg">
      {declaredMembers.length > 0 ? (
        <Div display="grid" gap="reference.sm">
          {inheritedGroups.length > 0 ? (
            <Small color="reference.muted">Own members</Small>
          ) : null}
          <ReferenceMemberRows members={declaredMembers} />
        </Div>
      ) : null}
      {inheritedGroups.map(group => (
        <ReferenceInheritedMemberSection key={group.origin.id} group={group} />
      ))}
    </Div>
  )
}

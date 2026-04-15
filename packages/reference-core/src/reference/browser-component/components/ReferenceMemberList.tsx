// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/ReferenceMemberList.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { useState, type ComponentProps, type CSSProperties } from 'react'
import { Div, Small } from '@reference-ui/react'
import type { ReferenceMemberDocument, ReferenceSymbolRef } from '../../browser/component-api'
import { ReferenceMemberRow } from './ReferenceMemberRow'
import { Divider } from './shared/Divider'
import { MonoText } from './shared/MonoText'

const COLLAPSIBLE_INHERITED_SECTION_THRESHOLD = 20
const COLLAPSED_INHERITED_SECTION_MEMBER_COUNT = 10

const memberRowsCss = {
  '& > :last-child': {
    borderBottomWidth: '0',
  },
} as ComponentProps<typeof Div>['css']

const declaredMemberRowsCss = {
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'reference.border',
  ...memberRowsCss,
} as ComponentProps<typeof Div>['css']

const inheritedSectionCss = {
  display: 'grid',
  gap: '2r',
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
  css,
}: {
  members: ReferenceMemberDocument[]
  css?: ComponentProps<typeof Div>['css']
}) {
  return (
    <Div css={css}>
      {members.map(member => (
        <ReferenceMemberRow
          key={member.id}
          member={member}
        />
      ))}
    </Div>
  )
}

function ReferenceInheritedMemberSection({ group }: { group: InheritedMemberGroup }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isCollapsible = group.members.length > COLLAPSIBLE_INHERITED_SECTION_THRESHOLD
  const visibleMembers =
    isCollapsible && !isExpanded
      ? group.members.slice(0, COLLAPSED_INHERITED_SECTION_MEMBER_COUNT)
      : group.members
  const hiddenMemberCount = group.members.length - visibleMembers.length

  return (
    <Div css={inheritedSectionCss}>
      <Divider marginBottom="2r" />
      <Div color="text.lighter">
        Inherited from <MonoText ml="1r"> {group.origin.name} ({group.members.length})</MonoText>
      </Div>
      

      <ReferenceMemberRows members={visibleMembers} css={memberRowsCss} />
      {isCollapsible ? (
        <Div color="reference.textLighter" _hover={{ color: 'reference.highlight' }}>
          <Div
            role="button"
            onClick={() => setIsExpanded(expanded => !expanded)}
            style={inheritedToggleButtonStyle}
          >
            {isExpanded
              ? 'Collapse inherited members'
              : `Show ${hiddenMemberCount} more inherited members`}
          </Div>
        </Div>
      ) : null}
    </Div>
  )
}

export function ReferenceMemberList({ members }: { members: ReferenceMemberDocument[] }) {
  if (members.length === 0) {
    return (
      <Small color="reference.textLight">No members were emitted for this interface.</Small>
    )
  }

  const { declaredMembers, inheritedGroups } = partitionMembers(members)

  return (
    <Div display="grid" gap="4r">
      {declaredMembers.length > 0 ? (
        <ReferenceMemberRows members={declaredMembers} css={declaredMemberRowsCss} />
      ) : null}
      {inheritedGroups.map(group => (
        <ReferenceInheritedMemberSection key={group.origin.id} group={group} />
      ))}
    </Div>
  )
}

// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/ReferenceMemberRow.tsx
import { Div, Small } from '@reference-ui/react'
import type { ReferenceMemberDocument } from '../types'
import { MemberDescription } from './MemberDescription'
import { MemberJsDoc } from './MemberJsDoc'
import { MemberName } from './MemberName'
import { MemberType } from './MemberType'
import { MemberTypeSummary } from './MemberTypeSummary'

export function ReferenceMemberRow({
  member,
  showInheritedFrom = true,
}: {
  member: ReferenceMemberDocument
  showInheritedFrom?: boolean
}) {
  return (
    <Div
      css={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        rowGap: '0.625rem',
        alignItems: 'start',
        paddingBlock: '1.25rem',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'reference.border',
      }}
    >
      <Div display="grid" gap="reference.xxs">
        <MemberName name={member.name} />
        {showInheritedFrom && member.inheritedFrom ? (
          <Small color="reference.muted">from {member.inheritedFrom.name}</Small>
        ) : null}
      </Div>
      <MemberType typeLabel={member.typeLabel} />

      <Div display="grid" gap="reference.md" minWidth="0">
        <MemberTypeSummary summary={member.summary.memberTypeSummary} />
        <MemberDescription description={member.summary.description} />
        <MemberJsDoc
          memberId={member.id}
          jsDoc={member.jsDoc}
          params={member.summary.paramDocs}
        />
      </Div>
    </Div>
  )
}

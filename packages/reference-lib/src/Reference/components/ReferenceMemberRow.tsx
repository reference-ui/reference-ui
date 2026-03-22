import { Div, Small } from '@reference-ui/react'
import type { ReferenceMemberDocument } from '@reference-ui/types'
import { MemberDescription } from './MemberDescription.js'
import { MemberJsDoc } from './MemberJsDoc.js'
import { MemberName } from './MemberName.js'
import { MemberType } from './MemberType.js'
import { MemberTypeSummary } from './MemberTypeSummary.js'

export function ReferenceMemberRow({ member }: { member: ReferenceMemberDocument }) {
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
        {member.inheritedFrom ? (
          <Small color="reference.muted">from {member.inheritedFrom.name}</Small>
        ) : null}
      </Div>
      <MemberType typeLabel={member.typeLabel} />

      <Div display="grid" gap="reference.md" minWidth="0">
        <MemberTypeSummary summary={member.summary.memberTypeSummary} />
        <MemberDescription description={member.summary.description} />
        <MemberJsDoc memberId={member.id} jsDoc={member.jsDoc} params={member.summary.paramDocs} />
      </Div>
    </Div>
  )
}

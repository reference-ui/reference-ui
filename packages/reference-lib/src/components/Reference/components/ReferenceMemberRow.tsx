import { Div } from '@reference-ui/react'
import type { ReferenceMemberDocument } from '@reference-ui/types'
import { MemberDescription } from './MemberDescription'
import { MemberJsDoc } from './MemberJsDoc'
import { MemberName } from './MemberName'
import { MemberType } from './MemberType'
import { MemberTypeSummary } from './MemberTypeSummary'

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
      <Div display="grid" gap="0.5r">
        <MemberName name={member.name} />
      </Div>
      <MemberType typeLabel={member.typeLabel} />

      <Div display="grid" gap="3r" minWidth="0">
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

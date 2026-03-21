import { Div } from '@reference-ui/react'
import type { ReferenceMemberDocument } from '../types'
import { MemberDescription } from './MemberDescription'
import { MemberJsDoc } from './MemberJsDoc'
import { MemberName } from './MemberName'
import { MemberType } from './MemberType'
import { MemberTypeSummary } from './MemberTypeSummary'

const MEMBER_GRID_COLUMNS = 'minmax(0, 13rem) minmax(0, 9rem) minmax(0, 1fr)'

export function ReferenceMemberRow({ member }: { member: ReferenceMemberDocument }) {
  return (
    <Div
      css={{
        display: 'grid',
        gridTemplateColumns: MEMBER_GRID_COLUMNS,
        columnGap: '1rem',
        alignItems: 'start',
        paddingBlock: '1.25rem',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'reference.border',
      }}
    >
      <MemberName name={member.name} />
      <MemberType typeLabel={member.typeLabel} />

      <Div display="grid" gap="reference.md">
        <MemberTypeSummary summary={member.summary.memberTypeSummary} />
        <MemberDescription description={member.summary.description} />
        <MemberJsDoc memberId={member.id} params={member.summary.paramDocs} />
      </Div>
    </Div>
  )
}

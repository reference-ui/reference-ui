/**
 * Reference member row: one member's name, type, JSDoc, and description
 * composed from the member chrome. Takes the member document; the list
 * owns order and collapsing, this owns the row.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { ReferenceMemberDocument } from '@reference-ui/types'
import { MemberDefault } from './MemberDefault'
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
        rowGap: '2r',
        alignItems: 'start',
        paddingBlock: '3r',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'reference.border',
      }}
    >
      <Div display="flex" alignItems="baseline" flexWrap="wrap" columnGap="3r" rowGap="0.5r" minWidth="0">
        <MemberName name={member.name} />
        <MemberType typeLabel={member.typeLabel} />
      </Div>

      <MemberTypeSummary summary={member.summary.memberTypeSummary} />
      <MemberDefault defaultValue={member.defaultValue} />
      <MemberDescription description={member.summary.description} />
      <MemberJsDoc memberId={member.id} jsDoc={member.jsDoc} params={member.summary.paramDocs} />
    </Div>
  )
}

// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/ReferenceMemberRow.tsx
 * This file is mirrored into reference-core by scripts/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Div, Small } from '@reference-ui/react'
import type { ReferenceMemberDocument } from '../../browser/component-api'
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

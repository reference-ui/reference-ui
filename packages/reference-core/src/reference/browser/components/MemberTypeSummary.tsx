// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/MemberTypeSummary.tsx
import { Div } from '@reference-ui/react'
import type { ReferenceMemberTypeSummary, ReferenceValueOption } from '../types'
import { SummaryChip } from './shared/SummaryChip'
import { SummarySnippet } from './shared/SummarySnippet'

export function MemberTypeSummary({ summary }: { summary?: ReferenceMemberTypeSummary }) {
  if (!summary) return null

  switch (summary.kind) {
    case 'valueSet':
      return <ReferenceValueSet options={summary.options} />
    case 'callSignature':
    case 'typeExpression':
    case 'opaqueType':
      return <SummarySnippet>{summary.text}</SummarySnippet>
    default:
      return null
  }
}

function ReferenceValueSet({ options }: { options: ReferenceValueOption[] }) {
  return (
    <Div display="flex" gap="reference.sm" flexWrap="wrap">
      {options.map(option => (
        <SummaryChip
          key={`${option.isDefault ? 'default' : 'value'}-${option.label}`}
          tone={option.isDefault ? 'accent' : 'soft'}
        >
          {option.label}
        </SummaryChip>
      ))}
    </Div>
  )
}

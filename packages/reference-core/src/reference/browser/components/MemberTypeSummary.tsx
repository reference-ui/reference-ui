import { Div } from '@reference-ui/react'
import type { ReferenceMemberTypeSummary, ReferenceValueOption } from '../types'
import { SummaryChip } from './shared/SummaryChip'

export function MemberTypeSummary({ summary }: { summary?: ReferenceMemberTypeSummary }) {
  if (!summary) return null

  switch (summary.kind) {
    case 'valueSet':
      return <ReferenceValueSet options={summary.options} />
    case 'callSignature':
    case 'typeExpression':
    case 'opaqueType':
      return (
        <SummaryChip>
          {summary.text}
        </SummaryChip>
      )
    default:
      return null
  }
}

function ReferenceValueSet({ options }: { options: ReferenceValueOption[] }) {
  return (
    <Div display="flex" gap="reference.sm" flexWrap="wrap">
      {options.map((option) => (
        <SummaryChip
          key={`${option.isDefault ? 'default' : 'value'}-${option.label}`}
          tone={option.isDefault ? 'accent' : 'soft'}
          radius="pill"
        >
          {option.label}
        </SummaryChip>
      ))}
    </Div>
  )
}

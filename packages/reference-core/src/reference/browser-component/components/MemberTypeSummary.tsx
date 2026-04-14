// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/MemberTypeSummary.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Div } from '@reference-ui/react'
import type {
  ReferenceMemberTypeSummary,
  ReferenceValueOption,
} from '../../browser/component-api'
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
    <Div display="flex" gap="2r" flexWrap="wrap">
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

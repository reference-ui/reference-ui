import { Div, Small } from '@reference-ui/react'
import { SummaryChip } from './shared/SummaryChip'

export function ReferenceTypeAliasDefinition({ definition }: { definition: string | null }) {
  return (
    <Div display="grid" gap="reference.sm" paddingTop="reference.sm">
      <Small color="reference.muted">Definition</Small>
      <SummaryChip>{definition ?? 'unknown'}</SummaryChip>
    </Div>
  )
}

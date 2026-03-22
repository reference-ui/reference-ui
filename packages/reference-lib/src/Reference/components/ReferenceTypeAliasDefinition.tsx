import { Div, Small } from '@reference-ui/react'
import { SummarySnippet } from './shared/SummarySnippet.js'

export function ReferenceTypeAliasDefinition({ definition }: { definition: string | null }) {
  return (
    <Div display="grid" gap="reference.sm" paddingTop="reference.sm">
      <Small color="reference.muted">Definition</Small>
      <SummarySnippet>{definition ?? 'unknown'}</SummarySnippet>
    </Div>
  )
}

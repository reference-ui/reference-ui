import { Div, Small } from '@reference-ui/react'
import { SummarySnippet } from './shared/SummarySnippet'

export function ReferenceTypeDefinition({ definition }: { definition: string | null }) {
  return (
    <Div display="grid" gap="2r" paddingTop="2r">
      <Small color="reference.textLight">Definition</Small>
      <SummarySnippet>{definition ?? 'unknown'}</SummarySnippet>
    </Div>
  )
}

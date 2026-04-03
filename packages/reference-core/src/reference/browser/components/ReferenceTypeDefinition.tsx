// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/ReferenceTypeDefinition.tsx
import { Div, Small } from '@reference-ui/react'
import { SummarySnippet } from './shared/SummarySnippet'

export function ReferenceTypeDefinition({ definition }: { definition: string | null }) {
  return (
    <Div display="grid" gap="reference.sm" paddingTop="reference.sm">
      <Small color="reference.muted">Definition</Small>
      <SummarySnippet>{definition ?? 'unknown'}</SummarySnippet>
    </Div>
  )
}

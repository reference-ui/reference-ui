// @ts-nocheck

/**
 * Source of truth: packages/reference-lib/src/Reference/components/ReferenceTypeDefinition.tsx
 * This file is mirrored into reference-core by tools/copy-reference-api-component.mjs.
 * Edit the reference-lib source, not this copy.
 */
import { Div, Small } from '@reference-ui/react'
import { SummarySnippet } from './shared/SummarySnippet'

export function ReferenceTypeDefinition({ definition }: { definition: string | null }) {
  return (
    <Div display="grid" gap="2r" paddingTop="2r">
      <Small color="reference.muted">Definition</Small>
      <SummarySnippet>{definition ?? 'unknown'}</SummarySnippet>
    </Div>
  )
}

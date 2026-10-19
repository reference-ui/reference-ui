/**
 * Reference type definition: renders the raw definition string for
 * aliases and memberless types. Takes the nullable definition; renders
 * nothing when there is no definition to show.
 */
import * as React from 'react'
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

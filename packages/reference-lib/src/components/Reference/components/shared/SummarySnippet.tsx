/**
 * Reference summary snippet: the boxed block for type summaries and value
 * sets. Takes Div props and layers authored css over the snippet style.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { MonoText } from './MonoText'

const SNIPPET_CSS = {
  display: 'block',
  width: '100%',
  maxWidth: '100%',
  fontSize: '3.5r',
  lineHeight: '1.5',
  paddingInline: '2.5r',
  paddingBlock: '1.5r',
  borderRadius: '1r',
  wordBreak: 'break-word',
  bg: 'reference.codeBackground',
  borderLeftWidth: '3px',
  borderLeftStyle: 'solid',
  borderLeftColor: 'reference.border',
} as const

/**
 * Block-style summary for signatures, type expressions, and other non-chip
 * monospace content. Use {@link SummaryChip} for compact inline chips (e.g. enum values).
 */
export type SummarySnippetProps = React.ComponentPropsWithoutRef<typeof Div>

export function SummarySnippet({ children, css, ...props }: SummarySnippetProps) {
  return (
    <Div css={{ ...SNIPPET_CSS, ...css }} {...props}>
      <MonoText color="reference.highlight">{children}</MonoText>
    </Div>
  )
}

import * as React from 'react'
import { Div } from '@reference-ui/react'
import { MonoText } from './MonoText'

const SNIPPET_CSS = {
  display: 'block',
  width: '100%',
  maxWidth: '100%',
  fontSize: '4.5r',
  fontWeight: '550',
  lineHeight: '1.45',
  paddingInline: '2r',
  paddingBlock: '2r',
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

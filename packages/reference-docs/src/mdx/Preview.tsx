// Flat specimen frame for live MDX examples.
// It takes example children and emits the borderless preview surface pages render demos in.
import type { ReactNode } from 'react'
import { Div, css } from '@reference-ui/react'

/**
 * Specimen frame for live examples: a hairline box on the page background, so
 * the demo sits on the same surface as the prose. When a fenced code block
 * follows, the two join into one unit: the frame drops its bottom corners and
 * margin, and the code panel below drops its top border and corners, so the
 * frame's bottom edge is the only line between demo and source.
 */
const frame = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4r',
  minHeight: '20r',
  padding: '8r',
  border: '1px solid',
  borderColor: 'docsBorder',
  borderRadius: 'md',
  marginBottom: '6r',
  '&:has(+ [data-rehype-pretty-code-figure])': {
    marginBottom: '0',
    borderBottomLeftRadius: '0',
    borderBottomRightRadius: '0',
  },
  '& + [data-rehype-pretty-code-figure] [data-code-surface]': {
    borderTopWidth: '0',
    borderTopLeftRadius: '0',
    borderTopRightRadius: '0',
  },
  // Source shown before its demo joins the same way, code on top.
  '&:is([data-rehype-pretty-code-figure] + *)': {
    borderTopWidth: '0',
    borderTopLeftRadius: '0',
    borderTopRightRadius: '0',
  },
})

export function Preview({ children }: { children: ReactNode }) {
  return (
    <Div className={frame} data-preview="">
      {children}
    </Div>
  )
}

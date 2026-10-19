/**
 * Reference monospace text: inline code with the highlight color and a
 * code-element reset. Takes children, an optional color, and style props
 * for names and snippets inside notices and rows.
 */
import * as React from 'react'
import { Code } from '@reference-ui/react'
import type { StyleProps } from '@reference-ui/react'

type MonoTextProps = StyleProps & {
  children: React.ReactNode
  color?: React.ComponentProps<typeof Code>['color']
}

const REFERENCE_CODE_RESET_CSS: any = {
  background: 'transparent',
  padding: '0',
  borderRadius: '0',
  boxShadow: 'none',
} as unknown as React.ComponentProps<typeof Code>['css']

export function MonoText({ children, color = 'reference.highlight', ...styleProps }: MonoTextProps) {
  return (
    <Code fontFamily="reference.mono" color={color} css={REFERENCE_CODE_RESET_CSS} {...styleProps}>
      {children}
    </Code>
  )
}

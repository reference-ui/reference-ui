import * as React from 'react'
import { Code } from '@reference-ui/react'

interface MonoTextProps {
  children: React.ReactNode
  color?: React.ComponentProps<typeof Code>['color']
}

const REFERENCE_CODE_RESET_CSS: any = {
  background: 'transparent',
  padding: '0',
  borderRadius: '0',
  boxShadow: 'none',
} as unknown as React.ComponentProps<typeof Code>['css']

export function MonoText({ children, color = 'blue.200' }: MonoTextProps) {
  return (
    <Code fontFamily="reference.mono" color={color} css={REFERENCE_CODE_RESET_CSS}>
      {children}
    </Code>
  )
}

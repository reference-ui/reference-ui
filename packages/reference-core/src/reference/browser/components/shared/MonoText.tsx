// This component is copied from reference-lib, do not modify here.
// Source: packages/reference-lib/src/Reference/components/shared/MonoText.tsx
import * as React from 'react'
import { Code } from '@reference-ui/react'

interface MonoTextProps {
  children: React.ReactNode
  color?: React.ComponentProps<typeof Code>['color']
}

const REFERENCE_CODE_RESET_CSS: any = {
  background: 'transparent',
  color: 'inherit',
  padding: '0',
  borderRadius: '0',
  boxShadow: 'none',
} as unknown as React.ComponentProps<typeof Code>['css']

export function MonoText({ children, color }: MonoTextProps) {
  return (
    <Code fontFamily="reference.mono" color={color} css={REFERENCE_CODE_RESET_CSS}>
      {children}
    </Code>
  )
}

import * as React from 'react'
import { Code } from '@reference-ui/react'

interface MonoTextProps {
  children: React.ReactNode
  color?: string
}

const REFERENCE_CODE_RESET_STYLE: React.CSSProperties = {
  background: 'transparent',
  color: 'inherit',
  padding: '0',
  borderRadius: '0',
  boxShadow: 'none',
}

export function MonoText({ children, color }: MonoTextProps) {
  return (
    <Code fontFamily="reference.mono" color={color} style={REFERENCE_CODE_RESET_STYLE}>
      {children}
    </Code>
  )
}

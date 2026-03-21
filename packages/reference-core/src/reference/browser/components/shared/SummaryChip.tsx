import * as React from 'react'
import { Span } from '@reference-ui/react'
import { MonoText } from './MonoText'

interface SummaryChipProps {
  children: React.ReactNode
  tone?: 'soft' | 'accent'
  radius?: 'pill' | 'rounded'
}

export function SummaryChip({
  children,
  tone = 'soft',
  radius = 'rounded',
}: SummaryChipProps) {
  const isAccent = tone === 'accent'

  return (
    <Span
      css={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '2rem',
        width: 'fit-content',
        maxWidth: '100%',
        paddingInline: '0.75rem',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isAccent ? 'reference.primary' : 'reference.primarySoftBorder',
        borderRadius: radius === 'pill' ? '9999px' : '0.5rem',
        background: isAccent ? 'reference.primary' : 'reference.primarySoftBackground',
        color: isAccent ? 'reference.primaryForeground' : 'reference.primarySoftForeground',
      }}
    >
      <MonoText>{children}</MonoText>
    </Span>
  )
}

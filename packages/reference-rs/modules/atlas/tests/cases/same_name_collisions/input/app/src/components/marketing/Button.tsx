import * as React from 'react'

export interface MarketingButtonProps {
  tone: 'hero' | 'secondary'
  children?: React.ReactNode
}

export function Button({ tone, children }: MarketingButtonProps): React.ReactElement {
  return <button data-tone={tone}>{children}</button>
}

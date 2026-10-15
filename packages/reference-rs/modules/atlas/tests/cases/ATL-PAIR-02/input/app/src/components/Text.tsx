import * as React from 'react'

export interface TextProps {
  children?: React.ReactNode
}

export function Text({ children }: TextProps): React.ReactElement {
  return <div>{children}</div>
}

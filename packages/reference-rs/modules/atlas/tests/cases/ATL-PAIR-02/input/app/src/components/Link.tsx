import * as React from 'react'

export interface LinkProps {
  children?: React.ReactNode
}

export function Link({ children }: LinkProps): React.ReactElement {
  return <div>{children}</div>
}

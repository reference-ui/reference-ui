import * as React from 'react'

export interface HeadingProps {
  children?: React.ReactNode
}

export function Heading({ children }: HeadingProps): React.ReactElement {
  return <div>{children}</div>
}

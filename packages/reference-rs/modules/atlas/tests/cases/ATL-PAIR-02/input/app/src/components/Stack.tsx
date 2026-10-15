import * as React from 'react'

export interface StackProps {
  children?: React.ReactNode
}

export function Stack({ children }: StackProps): React.ReactElement {
  return <div>{children}</div>
}

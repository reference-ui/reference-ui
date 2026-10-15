import * as React from 'react'

export interface LabelProps {
  children?: React.ReactNode
}

export function Label({ children }: LabelProps): React.ReactElement {
  return <div>{children}</div>
}

import * as React from 'react'

export interface SelectProps {
  children?: React.ReactNode
}

export function Select({ children }: SelectProps): React.ReactElement {
  return <div>{children}</div>
}

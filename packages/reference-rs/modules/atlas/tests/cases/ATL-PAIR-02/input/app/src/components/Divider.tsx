import * as React from 'react'

export interface DividerProps {
  children?: React.ReactNode
}

export function Divider({ children }: DividerProps): React.ReactElement {
  return <div>{children}</div>
}

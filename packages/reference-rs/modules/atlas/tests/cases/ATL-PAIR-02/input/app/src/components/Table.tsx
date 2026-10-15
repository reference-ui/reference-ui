import * as React from 'react'

export interface TableProps {
  children?: React.ReactNode
}

export function Table({ children }: TableProps): React.ReactElement {
  return <div>{children}</div>
}

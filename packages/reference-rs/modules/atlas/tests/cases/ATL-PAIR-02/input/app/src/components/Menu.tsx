import * as React from 'react'

export interface MenuProps {
  children?: React.ReactNode
}

export function Menu({ children }: MenuProps): React.ReactElement {
  return <div>{children}</div>
}

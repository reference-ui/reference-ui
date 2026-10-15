import * as React from 'react'

export interface TabsProps {
  children?: React.ReactNode
}

export function Tabs({ children }: TabsProps): React.ReactElement {
  return <div>{children}</div>
}

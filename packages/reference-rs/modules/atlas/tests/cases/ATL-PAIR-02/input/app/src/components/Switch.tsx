import * as React from 'react'

export interface SwitchProps {
  children?: React.ReactNode
}

export function Switch({ children }: SwitchProps): React.ReactElement {
  return <div>{children}</div>
}

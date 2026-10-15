import * as React from 'react'

export interface AlertProps {
  children?: React.ReactNode
}

export function Alert({ children }: AlertProps): React.ReactElement {
  return <div>{children}</div>
}

import * as React from 'react'

export interface DialogProps {
  children?: React.ReactNode
}

export function Dialog({ children }: DialogProps): React.ReactElement {
  return <div>{children}</div>
}

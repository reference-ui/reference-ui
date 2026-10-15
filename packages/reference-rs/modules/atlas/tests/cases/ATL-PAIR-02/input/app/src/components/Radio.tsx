import * as React from 'react'

export interface RadioProps {
  children?: React.ReactNode
}

export function Radio({ children }: RadioProps): React.ReactElement {
  return <div>{children}</div>
}

import * as React from 'react'

export interface ButtonProps {
  children?: React.ReactNode
}

export function Button({ children }: ButtonProps): React.ReactElement {
  return <button>{children}</button>
}

import * as React from 'react'

export interface InputProps {
  children?: React.ReactNode
}

export function Input({ children }: InputProps): React.ReactElement {
  return <div>{children}</div>
}

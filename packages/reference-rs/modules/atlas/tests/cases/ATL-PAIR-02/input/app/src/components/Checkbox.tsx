import * as React from 'react'

export interface CheckboxProps {
  children?: React.ReactNode
}

export function Checkbox({ children }: CheckboxProps): React.ReactElement {
  return <div>{children}</div>
}

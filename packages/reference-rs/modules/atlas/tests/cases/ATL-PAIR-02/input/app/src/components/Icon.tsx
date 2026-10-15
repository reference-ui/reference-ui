import * as React from 'react'

export interface IconProps {
  children?: React.ReactNode
}

export function Icon({ children }: IconProps): React.ReactElement {
  return <div>{children}</div>
}

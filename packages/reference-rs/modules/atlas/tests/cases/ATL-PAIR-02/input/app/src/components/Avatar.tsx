import * as React from 'react'

export interface AvatarProps {
  children?: React.ReactNode
}

export function Avatar({ children }: AvatarProps): React.ReactElement {
  return <div>{children}</div>
}

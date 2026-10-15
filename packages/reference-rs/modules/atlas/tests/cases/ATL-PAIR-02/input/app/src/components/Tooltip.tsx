import * as React from 'react'

export interface TooltipProps {
  children?: React.ReactNode
}

export function Tooltip({ children }: TooltipProps): React.ReactElement {
  return <div>{children}</div>
}

import * as React from 'react'

export interface CardProps {
  children?: React.ReactNode
}

export function Card({ children }: CardProps): React.ReactElement {
  return <section>{children}</section>
}
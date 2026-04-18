import type { StyleProps } from '@reference-ui/react'
import * as Ref from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Ref.Div {...styleProps}>{title}</Ref.Div>
}
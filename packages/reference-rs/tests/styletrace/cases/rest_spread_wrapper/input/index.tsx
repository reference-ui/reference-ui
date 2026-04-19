import { Div, type StyleProps } from '@reference-ui/react'

type CardProps = StyleProps & {
  id?: string
}

export function Card({ id, ...styleProps }: CardProps) {
  return <Div data-id={id} {...styleProps} />
}
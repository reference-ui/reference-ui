import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Ärger({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}

export function Kärtchen({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}

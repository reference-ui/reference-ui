import { Div, type StyleProps } from '@reference-ui/react'
import { Broken } from './broken'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}

export function Wrapped(props: CardProps) {
  return <Broken {...props} />
}

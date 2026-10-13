/**
 * Entry file for the parse_failure_isolated station: Card traces while its
 * unparsable sibling is skipped.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}

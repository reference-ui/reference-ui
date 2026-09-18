/**
 * Traced wrapper for ATM-SITE-56: forwards StyleProps into Div, so engine
 * discovery names Card with no jsxHosts and no declarations on disk.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}

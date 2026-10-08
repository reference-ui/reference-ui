/**
 * In-scope wrapper for ATM-SCAN-02: forwards StyleProps into Div, so it
 * traces under every include.
 */
import { Div, type StyleProps } from '@reference-ui/react'

export type CardProps = StyleProps & {
  title?: string
}

export function Card({ title, ...styleProps }: CardProps) {
  return <Div {...styleProps}>{title}</Div>
}

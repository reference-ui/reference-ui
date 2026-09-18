/**
 * Traced wrapper for ATM-SITE-58: the Accordion boundary shape
 * (`Omit<PrimitiveProps<'div'>, ...> & {...}`) forwarding rest into Div.
 * The `@reference-ui/react` import dangles (wipe-state), so discovery must
 * resolve the surface-type name from the engine surface, not from disk.
 */
import { Div, type PrimitiveProps } from '@reference-ui/react'

export type CardProps = Omit<PrimitiveProps<'div'>, 'onChange'> & {
  title?: string
}

export function Card({ title, ...rest }: CardProps) {
  return <Div {...rest}>{title}</Div>
}

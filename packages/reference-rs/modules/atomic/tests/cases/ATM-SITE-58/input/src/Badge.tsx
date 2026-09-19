/**
 * Second traced wrapper for ATM-SITE-58: the bare `PrimitiveProps<'span'>`
 * boundary shape forwarding rest into Span under the same dangling import.
 */
import { Span, type PrimitiveProps } from '@reference-ui/react'

export type BadgeProps = PrimitiveProps<'span'>

export function Badge({ ...rest }: BadgeProps) {
  return <Span {...rest} />
}

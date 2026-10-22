/**
 * Test file.
 * Three components whose props arrive through an object-pattern parameter, with the rest re-destructured in the body.
 * The forwardRef and plain forms re-destructure the rest and spread what is left into a primitive, and the direct form spreads the rest as is.
 * It inputs those three shapes and emits all three components, since each rest carries StyleProps into Div.
 */

import * as React from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

type CardProps = StyleProps & { title?: string; role?: string }

export const Forwarded = React.forwardRef<HTMLDivElement, CardProps>(
  function Forwarded({ title, ...props }, ref) {
    const { role: _role, ...restProps } = props as Record<string, unknown>
    return <Div ref={ref} {...restProps}>{title}</Div>
  }
)

export function Plain({ title, ...props }: CardProps) {
  const { role: _role, ...restProps } = props
  return <Div {...restProps}>{title}</Div>
}

export function Direct({ title, ...props }: CardProps) {
  return <Div {...props}>{title}</Div>
}

// Components for the CORE-LAYERS-19 upstream package, acme. It takes style props and children and emits two
// Spans through acme's own runtime: `Badge` styles itself with acme's tokens (`brand`, the public `acmeOnly`
// and the private `_private.seal`), so acme's sync emits those rules; `Plain` styles nothing and forwards
// whatever its caller writes. The prebuilt fixture ships the same two components as plain JS.
import type { ReactElement, ReactNode } from 'react'
import { Span, type StyleProps } from '@reference-ui/react'

export type AcmeProps = StyleProps & {
  id?: string
  children?: ReactNode
}

export function Badge({ children, ...rest }: AcmeProps): ReactElement {
  return (
    <Span bg="brand" color="acmeOnly" borderColor="_private.seal" {...rest}>
      {children}
    </Span>
  )
}

export function Plain({ children, ...rest }: AcmeProps): ReactElement {
  return <Span {...rest}>{children}</Span>
}

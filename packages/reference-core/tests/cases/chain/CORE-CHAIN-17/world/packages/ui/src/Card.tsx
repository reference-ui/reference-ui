// Card for the CORE-CHAIN-17 workspace package. It takes a Div's props and children and emits a Div that carries them,
// so a sync over this source traces Card as a wrapper host. Its `@reference-ui/react` is whichever runtime the
// package renders through: the root's in the one-system shape, its own once it runs its own sync.
import type { ReactElement } from 'react'
import { Div, type DivProps } from '@reference-ui/react'

export function Card({ children, ...rest }: DivProps): ReactElement {
  return <Div {...rest}>{children}</Div>
}

// Tile for the CORE-CHAIN-16 upstream package. It takes style props and children and emits a Div that carries them, so
// the upstream's sync traces Tile as a wrapper host and publishes it in `jsxElements`, the way a real package's is.
import type { ReactElement, ReactNode } from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

export type TileProps = StyleProps & {
  children?: ReactNode
}

export function Tile({ children, ...rest }: TileProps): ReactElement {
  return <Div {...rest}>{children}</Div>
}

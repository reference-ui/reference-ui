// Tile for the CORE-CHAIN-15 upstream package. It takes style props and children and emits a Div that carries them, so
// the upstream's sync traces Tile as a wrapper host and publishes it in `jsxElements`. The prebuilt fixture ships the
// same component as plain JS; this source exists only so the published roster names Tile the way a real package's does.
import type { ReactElement, ReactNode } from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

export type TileProps = StyleProps & {
  children?: ReactNode
}

export function Tile({ children, ...rest }: TileProps): ReactElement {
  return <Div {...rest}>{children}</Div>
}

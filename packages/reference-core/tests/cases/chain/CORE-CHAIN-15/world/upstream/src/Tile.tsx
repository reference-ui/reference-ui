// Tile for the CORE-CHAIN-15 upstream package. It takes style props and children and emits a Div that carries them, so
// the upstream's sync traces Tile as a wrapper host and publishes it in `jsxElements`. The spec builds this source into
// the package's `dist/`, which renders it through the package's own bound runtime, never the app's.
import type { ReactElement, ReactNode } from 'react'
import { Div, type StyleProps } from '@reference-ui/react'

export type TileProps = StyleProps & {
  children?: ReactNode
}

export function Tile({ children, ...rest }: TileProps): ReactElement {
  return <Div {...rest}>{children}</Div>
}

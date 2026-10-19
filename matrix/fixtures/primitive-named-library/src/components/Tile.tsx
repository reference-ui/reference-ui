/**
 * `Tile`: the package's plain style-prop forwarding wrapper, published in
 * `jsxElements` by tracing alone (chain T18's ownership probe).
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import type { DivProps } from '@reference-ui/react'

export type TileProps = DivProps

/**
 * A plain forwarding wrapper: every style prop the caller passes lands on the
 * package's own `Div`, so tracing publishes `Tile` in `jsxElements`. Rendered
 * by this package's bundled runtime, a caller's `padding` mints
 * `primitive-named-library__p_*`, never a class under the caller's name.
 */
export function Tile(props: TileProps): React.ReactElement {
  return <Div data-slot="tile" display="block" {...props} />
}

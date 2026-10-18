import * as React from 'react'
import { Tile } from '@fixtures/primitive-named-library'

/**
 * A wrapper name the package published in `jsxElements` (plan probe 1b).
 * Composing the package merges that roster into the consumer's hosts, but the
 * import binds `Tile` to the package, whose runtime mints
 * `primitive-named-library__p_*`.
 */
export function TileProbe(): React.ReactElement {
  return (
    <Tile data-testid="t18-tile" padding="t18TileGap">
      published wrapper
    </Tile>
  )
}

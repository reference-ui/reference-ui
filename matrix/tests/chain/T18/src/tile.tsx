/**
 * A wrapper name the package published in `jsxElements` (plan probe 1b).
 * Composing the package sends that roster with the compile request apart from
 * the consumer's own hosts (`upstreamHosts`), and the import binds `Tile` to
 * the package, whose runtime mints `primitive-named-library__p_*`.
 */

import * as React from 'react'
import { Tile } from '@fixtures/primitive-named-library'

export function TileProbe(): React.ReactElement {
  return (
    <Tile data-testid="t18-tile" padding="t18TileGap">
      published wrapper
    </Tile>
  )
}

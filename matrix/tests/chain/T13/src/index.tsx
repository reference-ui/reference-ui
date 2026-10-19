import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { MetaExtend2Demo } from '@fixtures/meta-extend-library-2'
import { LayerPrivateDemo } from '@fixtures/layer-library'

export const matrixChainT13Marker = 'reference-ui-matrix-chain-t13'

/**
 * T13 render entry — parallel chains + shared layer.
 *
 * Mounts both extend-chain endpoints beside the app-level layered demo: two
 * transitive chains plus one layered library in a single build. The contract
 * spec pins each chain's tokens and the layered scope.
 */
export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t13-root">
      <h1>Reference UI chain T13 matrix</h1>
      <p>Two extend-chains plus an app-level layered library.</p>
      <MetaExtendDemo />
      <MetaExtend2Demo />
      <LayerPrivateDemo />
    </Main>
  )
}

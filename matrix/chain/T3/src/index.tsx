import * as React from 'react'
import { Main } from '@reference-ui/react'
import { DemoComponent } from '@fixtures/extend-library'
import { LayerPrivateDemo } from '@fixtures/layer-library'

export const matrixChainT3Marker = 'reference-ui-matrix-chain-t3'

/**
 * T3 render entry.
 *
 * Mounts components from both upstream libraries at a single boundary where:
 * - extend-library is adopted via `extends` (tokens + fragment)
 * - layer-library is adopted via `layers` (CSS only, no token adoption)
 *
 * DemoComponent proves the extend-library's tokens resolved in this context.
 * LayerPrivateDemo proves the layer-library's CSS arrived without leaking
 * its private tokens into chain-t3's global namespace.
 */
export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t3-root">
      <h1>Reference UI chain T3 matrix</h1>
      <p>
        Hybrid boundary: extend-library tokens adopted; layer-library CSS
        only. Both composition modes active at once.
      </p>
      <DemoComponent />
      <LayerPrivateDemo />
    </Main>
  )
}

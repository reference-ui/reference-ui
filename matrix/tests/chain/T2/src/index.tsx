import * as React from 'react'
import { LayerPrivateDemo, LightDarkDemo } from '@fixtures/layer-library'

export const matrixChainT2Marker = 'reference-ui-matrix-chain-t2'

/**
 * T2 render entry.
 *
 * Mounts layer-library components in a context where chain-t2 has adopted only
 * layer-library's portable CSS via `layers` — not its fragment.
 *
 * LayerPrivateDemo demonstrates that `layerPrivateAccent` resolves inside the
 * library's own component (same layer scope) even though the token is NOT
 * available in chain-t2's global token namespace.
 */
export function Index(): React.ReactElement {
  return (
    <main data-testid="chain-t2-root">
      <h1>Reference UI chain T2 matrix</h1>
      <p>
        Layer one library. Upstream CSS is assembled but upstream tokens are NOT
        adopted into this package&apos;s config surface.
      </p>
      <LayerPrivateDemo />
      <LightDarkDemo />
    </main>
  )
}

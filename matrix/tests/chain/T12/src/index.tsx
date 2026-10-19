import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { MetaSiblingDemo } from '@fixtures/meta-extend-library-sibling'

export const matrixChainT12Marker = 'reference-ui-matrix-chain-t12'

/**
 * T12 render entry — diamond base, mixed branches.
 *
 * Mounts the layered branch inside its own layer scope beside the extended
 * sibling branch, both built on the same shared base. Layered tokens stay
 * scoped to their layer while the extended branch flows into the app; the
 * contract spec pins both branches.
 */
export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t12-root">
      <h1>Reference UI chain T12 matrix</h1>
      <p>
        Diamond base, mixed branches. The layered branch keeps its tokens
        scoped to its own layer; the extended branch flows into the app.
      </p>
      <div data-layer="meta-extend-library" data-testid="meta-extend-layer-scope">
        <MetaExtendDemo />
      </div>
      <MetaSiblingDemo />
    </Main>
  )
}

import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { MetaExtend2Demo } from '@fixtures/meta-extend-library-2'
import { LayerPrivateDemo } from '@fixtures/layer-library'

export const matrixChainT18Marker = 'reference-ui-matrix-chain-t18'

export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t18-root">
      <h1>Reference UI chain T18 matrix</h1>
      <p>Two extend-chains plus an app-level layered library.</p>
      <MetaExtendDemo />
      <MetaExtend2Demo />
      <LayerPrivateDemo />
    </Main>
  )
}

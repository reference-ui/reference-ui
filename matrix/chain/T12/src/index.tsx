import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { LayerPrivateDemo } from '@fixtures/layer-library'

export const matrixChainT12Marker = 'reference-ui-matrix-chain-t12'

export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t12-root">
      <h1>Reference UI chain T12 matrix</h1>
      <p>
        Chain (extend → extend) plus layer at the app. Layered tokens must
        stay invisible to the app&apos;s config surface.
      </p>
      <MetaExtendDemo />
      <LayerPrivateDemo />
    </Main>
  )
}

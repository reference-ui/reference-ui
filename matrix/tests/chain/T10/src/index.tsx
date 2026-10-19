import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { LayerPrivateDemo } from '@fixtures/layer-library'

export const matrixChainT10Marker = 'reference-ui-matrix-chain-t10'

/**
 * T10 render entry — chain + layer at the app.
 *
 * Mounts the extend-chain endpoint (`MetaExtendDemo`, local plus transitive
 * tokens) beside the app-level layered demo (`LayerPrivateDemo`). The layered
 * tokens resolve inside their own scope and stay out of the app's namespace;
 * the contract spec pins both halves.
 */
export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t10-root">
      <h1>Reference UI chain T10 matrix</h1>
      <p>
        Chain (extend → extend) plus layer at the app. Layered tokens must
        stay invisible to the app&apos;s config surface.
      </p>
      <MetaExtendDemo />
      <LayerPrivateDemo />
    </Main>
  )
}

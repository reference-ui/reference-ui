import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { MetaExtend2Demo } from '@fixtures/meta-extend-library-2'

export const matrixChainT11Marker = 'reference-ui-matrix-chain-t11'

/**
 * T11 render entry — parallel chains.
 *
 * Mounts both chain endpoints (`MetaExtendDemo`, `MetaExtend2Demo`), two
 * independent transitive paths landing at one app boundary. Each resolves its
 * local plus shared-base tokens; the contract spec pins both chains.
 */
export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t11-root">
      <h1>Reference UI chain T11 matrix</h1>
      <p>Two independent extend-chains composed at one app boundary.</p>
      <MetaExtendDemo />
      <MetaExtend2Demo />
    </Main>
  )
}

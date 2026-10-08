import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { MetaExtend2Demo } from '@fixtures/meta-extend-library-2'

export const matrixChainT11Marker = 'reference-ui-matrix-chain-t11'

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

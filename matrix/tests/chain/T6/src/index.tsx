import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'

export const matrixChainT6Marker = 'reference-ui-matrix-chain-t6'

export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t6-root">
      <h1>Reference UI chain T6 matrix</h1>
      <p>
        Transitive extend chain. The app extends only the outer published
        package; the inner package&apos;s tokens flow through automatically.
      </p>
      <MetaExtendDemo />
    </Main>
  )
}

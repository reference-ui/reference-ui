import * as React from 'react'
import { Main } from '@reference-ui/react'
import { DemoComponent } from '@fixtures/extend-library'

export const matrixChainT8Marker = 'reference-ui-matrix-chain-t8'

export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t8-root">
      <h1>Reference UI chain T8 matrix</h1>
      <p>
        Same library appears in both <code>extends</code> and <code>layers</code>.
        Documented allow-and-duplicate policy.
      </p>
      <DemoComponent />
    </Main>
  )
}

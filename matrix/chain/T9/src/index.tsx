import * as React from 'react'
import { Main } from '@reference-ui/react'
import { DemoComponent } from '@fixtures/extend-library'
import { SecondaryDemoComponent } from '@fixtures/extend-library-2'
import { LayerPrivateDemo } from '@fixtures/layer-library'
import { LayerPrivate2Demo } from '@fixtures/layer-library-2'

export const matrixChainT9Marker = 'reference-ui-matrix-chain-t9'

export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t9-root">
      <h1>Reference UI chain T9 matrix</h1>
      <p>
        Two extends + two layers. Bucket order is preserved:
        <code>extends...</code>, then <code>layers...</code>, then local.
      </p>
      <DemoComponent />
      <SecondaryDemoComponent />
      <LayerPrivateDemo />
      <LayerPrivate2Demo />
    </Main>
  )
}

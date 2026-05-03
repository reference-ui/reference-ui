import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { MetaSiblingDemo } from '@fixtures/meta-extend-library-sibling'

export const matrixChainT17Marker = 'reference-ui-matrix-chain-t17'

export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t17-root">
      <h1>Reference UI chain T17 matrix</h1>
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

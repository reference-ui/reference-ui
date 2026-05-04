import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'
import { MetaSiblingDemo } from '@fixtures/meta-extend-library-sibling'

export const matrixChainT7Marker = 'reference-ui-matrix-chain-t7'

export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t7-root">
      <h1>Reference UI chain T7 matrix</h1>
      <p>
        Diamond composition. Two siblings built on the same base both flow
        into the app via extend.
      </p>
      <MetaExtendDemo />
      <MetaSiblingDemo />
    </Main>
  )
}

import * as React from 'react'
import { Main } from '@reference-ui/react'
import { MetaExtendDemo } from '@fixtures/meta-extend-library'

export const matrixChainT6Marker = 'reference-ui-matrix-chain-t6'

/**
 * T6 render entry.
 *
 * Mounts the outer library's MetaExtendDemo where chain-t6 extends only
 * meta-extend-library. Both the outer local tokens and the transitive
 * extend-library tokens resolve through the republished fragment.
 */
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

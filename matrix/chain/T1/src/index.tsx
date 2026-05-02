import * as React from 'react'
import { Main } from '@reference-ui/react'
import { DemoComponent } from '@fixtures/extend-library'

export const matrixChainT1Marker = 'reference-ui-matrix-chain-t1'

/**
 * T1 render entry.
 *
 * Mounts the extend-library's DemoComponent in a context where chain-t1 has
 * fully adopted extend-library's fragment + tokens via `extends`.
 * The DemoComponent uses `fixtureDemoBg`, `fixtureDemoText`, and
 * `fixtureDemoAccent` tokens — all sourced from the upstream library.
 */
export function Index(): React.ReactElement {
  return (
    <Main data-testid="chain-t1-root">
      <h1>Reference UI chain T1 matrix</h1>
      <p>
        Extend one library. Upstream tokens and types are adopted into this
        package&apos;s config surface.
      </p>
      <DemoComponent />
    </Main>
  )
}

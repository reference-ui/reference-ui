import * as React from 'react'
import { css } from '@reference-ui/react'
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
 *
 * Also renders an attempt at consuming `_private.brand` from this package's
 * own source. Because `_private` token subtrees are stripped from upstream
 * fragments before they enter this package's Panda config, no CSS rule is
 * generated and the element falls back to its default color.
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
      <span
        data-testid="chain-t1-private-attempt"
        // Cast: `_private.brand` is intentionally not part of this package's
        // generated token union — that's the whole privacy guarantee under
        // test. Asserting the runtime style fails to apply proves Panda did
        // not generate a CSS rule for an unknown token reference.
        className={css({
          color: '_private.brand' as never,
          borderColor: '_private.brand' as never,
          borderStyle: 'solid',
          borderWidth: '2px',
          padding: '4px',
        })}
      >
        Private token reference from downstream consumer (should not resolve).
      </span>
    </Main>
  )
}

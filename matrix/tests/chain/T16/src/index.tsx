import * as React from 'react'
import { CheckIcon } from '@reference-ui/lib'
import { ContentCopyIcon } from '@reference-ui/icons'
import { CheckBadge, CopyBadge } from '@fixtures/aliased-host-library'

export const matrixChainT16Marker = 'reference-ui-matrix-chain-t16'

/**
 * T16 render entry.
 *
 * Mounts prebuilt aliased-host components through both composition paths:
 * real icons through the transitive extends chain (T16 extends lib, lib
 * layers icons) in both import shapes (lib re-export and direct package
 * import), plus the fixture badges through a direct `layers` entry. Every
 * shell below renders style props on an `as`-cast alias — if StyleTrace or
 * composition drops any of them, the contract spec fails on unbacked
 * classes, console warnings, or computed styles.
 */
export function Index(): React.ReactElement {
  return (
    <main data-testid="chain-t16-root">
      <h1>Reference UI chain T16 matrix</h1>
      <p>
        Compose a prebuilt aliased-host package. Icons arrive transitively
        through lib&apos;s layers; badges arrive through a direct layers
        entry. All shells must be styled with zero runtime misses.
      </p>
      <CheckIcon data-testid="t16-lib-icon" />
      <ContentCopyIcon data-testid="t16-direct-icon" />
      <CheckBadge data-testid="t16-fixture-check-badge" />
      <CopyBadge data-testid="t16-fixture-copy-badge" />
    </main>
  )
}

/**
 * T18 render entry — component ownership.
 *
 * Every probe styles a component that renders through ANOTHER package's
 * bundled runtime, one import shape per file. Each must be backed under that
 * package's system name and paint the consumer token; a probe backed under
 * `chain-t18__` is the ownership bug the provenance gate fixes.
 */

import * as React from 'react'
import { AcmeButtonProbe } from './acme-button'
import { BarrelButtonProbe } from './barrel-button'
import { ChipProbe } from './chip'
import { IconProbe } from './icon'
import { LibButtonProbe } from './lib-button'
import { NamespaceButtonProbe } from './namespace-button'
import { matrixChainT18Marker } from './probe'
import { TileProbe } from './tile'
import { WrapperButtonProbe } from './wrapper-button'

export { matrixChainT18Marker }

export function Index(): React.ReactElement {
  return (
    <main data-testid="chain-t18-root">
      <h1>Reference UI chain T18 matrix</h1>
      <p>
        Ownership by provenance: a tag imported from a package is never an own
        host, whatever it is called and however it reaches the file.
      </p>
      <LibButtonProbe />
      <NamespaceButtonProbe />
      <IconProbe />
      <ChipProbe />
      <AcmeButtonProbe />
      <BarrelButtonProbe />
      <WrapperButtonProbe />
      <TileProbe />
    </main>
  )
}

import * as React from 'react'
import { Button as AcmeButton, Tile } from '@fixtures/primitive-named-library'
import { Button } from '@reference-ui/lib/primitives'

/**
 * Partly-composed leg: lib is extended, the fixture is not. Both fixture tags
 * warn and back nothing; the lib `Button` is backed under lib's systems. The
 * fixture's `Button` spells a name lib also publishes, so only provenance can
 * tell the two apart.
 */
export function PartialProbes(): React.ReactElement {
  return (
    <div>
      <Tile padding="t18PartialTileGap">fixture wrapper</Tile>
      <AcmeButton color="t18PartialAcmeInk">fixture primitive</AcmeButton>
      <Button color="t18PartialLibInk">lib primitive</Button>
    </div>
  )
}

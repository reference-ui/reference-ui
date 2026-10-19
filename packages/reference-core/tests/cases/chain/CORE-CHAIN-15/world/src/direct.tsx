// Direct imports for the CORE-CHAIN-15 world. It takes `Button` and `Tile` straight from the installed package, unaliased,
// and emits both styled with the consumer-only token. `Button` spells an own primitive's name and `Tile` is a name the
// upstream publishes in `jsxElements`, so only the import proves either one renders through the package's runtime.
import type { ReactElement } from 'react'
import { Button, Tile } from '@fixture/chain15'

export function Direct(): ReactElement {
  return (
    <>
      <Button color="chain15Ink" data-testid="chain15-direct">
        direct button
      </Button>
      <Tile color="chain15Ink" data-testid="chain15-tile">
        published tile
      </Tile>
    </>
  )
}

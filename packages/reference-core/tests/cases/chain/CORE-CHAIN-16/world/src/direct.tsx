// Direct imports for the CORE-CHAIN-16 world. It takes `Button` and `Tile` straight from the installed package, unaliased,
// and emits both styled with the consumer token, plus one `Tile` with no style props. The styled two must each warn at
// their own line; the unstyled one has nothing to back, so it must stay silent.
import type { ReactElement } from 'react'
import { Button, Tile } from '@fixture/chain16'

export function Direct(): ReactElement {
  return (
    <>
      <Button color="chain16Ink">direct button</Button>
      <Tile color="chain16Ink">published tile</Tile>
      <Tile>plain tile</Tile>
    </>
  )
}

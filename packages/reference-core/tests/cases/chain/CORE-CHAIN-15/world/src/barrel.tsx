// Barrel use site for the CORE-CHAIN-15 world. It takes `Button` through the project barrel `./ui/index.js` and emits it
// styled with the consumer-only token. The import is relative and the name is an own primitive's, so ownership has to
// follow the barrel's re-export to the package it ends at.
import type { ReactElement } from 'react'
import { Button } from './ui/index.js'

export function Barrel(): ReactElement {
  return (
    <Button color="chain15Ink" data-testid="chain15-barrel">
      barrel button
    </Button>
  )
}

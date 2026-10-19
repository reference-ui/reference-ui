// Barrel use site for the CORE-CHAIN-16 world. It takes `Button` through the project barrel `./ui/index.js` and emits it
// styled with the consumer token. The warning must land here, at the use site, and name the package the barrel ends at.
import type { ReactElement } from 'react'
import { Button } from './ui/index.js'

export function Barrel(): ReactElement {
  return <Button color="chain16Ink">barrel button</Button>
}

/**
 * Use sites for ATM-SITE-58: both traced wrappers carry a style prop while
 * Random carries one it cannot forward.
 */
import { Card } from './Card'
import { Badge } from './Badge'
import { Random } from './Random'

export function App() {
  return (
    <>
      <Card mt="4r" />
      <Badge mt="2r" />
      <Random color="red.500" />
    </>
  )
}

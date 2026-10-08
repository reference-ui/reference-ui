/**
 * Use sites for ATM-SITE-56: Card carries a style prop, Random carries one
 * it cannot forward, Label is styleless.
 */
import { Card } from './Card'
import { Random } from './Random'
import { Label } from './Label'

export function App() {
  return (
    <>
      <Card mt="4r" />
      <Random color="red.500" />
      <Label text="hi" />
    </>
  )
}

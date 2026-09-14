/** Fixture demonstrating responsive array prop lowering to canonical breakpoints. */
import { Div } from '@reference-ui/react'

export function App() {
  return (
    <Div
      mt={["1r", "2r", "4r"]}
    />
  )
}

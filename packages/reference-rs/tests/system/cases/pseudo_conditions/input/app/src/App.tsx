/** Fixture demonstrating pseudo-selector and color-mode condition scoping. */
import { Div } from '@reference-ui/react'

export function App() {
  return (
    <Div
      color="blue.600"
      _hover={{ color: "red.500" }}
      _dark={{ bg: "gray.900" }}
    />
  )
}

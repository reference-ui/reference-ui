/** Fixture demonstrating composite border and outline shorthand decomposition without currentColor clobbering. */
import { Div } from '@reference-ui/react'

export function App() {
  return (
    <Div
      borderBottom="3px solid"
      borderColor="gray.800"
      outline="1px solid"
      outlineColor="blue.600"
    />
  )
}

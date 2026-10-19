/**
 * Use sites for ATM-SITE-101: the app imports `Card` from the workspace
 * package `@acme/ui` by its bare name, through the `node_modules` link a pnpm
 * workspace makes, beside an own `Div` control.
 */
import { Div } from '@reference-ui/react'
import { Card } from '@acme/ui'

export function App() {
  return (
    <Div p="1r">
      <Card bg="red" />
    </Div>
  )
}

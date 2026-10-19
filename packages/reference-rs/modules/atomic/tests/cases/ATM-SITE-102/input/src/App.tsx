/**
 * Use sites for ATM-SITE-102: the app imports `Panel` from the workspace
 * package `@acme/panel`, whose entry is its built `dist`, beside an own `Div`
 * control.
 */
import { Div } from '@reference-ui/react'
import { Panel } from '@acme/panel'

export function App() {
  return (
    <Div p="1r">
      <Panel bg="red" />
    </Div>
  )
}

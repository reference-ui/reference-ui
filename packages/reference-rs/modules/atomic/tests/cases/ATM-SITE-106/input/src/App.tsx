/**
 * Use sites for ATM-SITE-106: the app imports `Panel` from the built workspace
 * package `@acme/panel` beside an own `Div` control, before the first sync has
 * generated the runtime both render through.
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

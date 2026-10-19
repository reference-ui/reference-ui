/**
 * Use sites for ATM-SITE-104: `BoltIcon` from `@reference-ui/lib`, which
 * re-exports icons and so renders through two systems, beside an own `Div`
 * control.
 */
import { Div } from '@reference-ui/react'
import { BoltIcon } from '@reference-ui/lib'

export function App() {
  return (
    <Div p="1r">
      <BoltIcon color="red" />
    </Div>
  )
}

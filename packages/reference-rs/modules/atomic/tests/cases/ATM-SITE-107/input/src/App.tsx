/**
 * Use sites for ATM-SITE-107: `StarIcon` from `@acme/icons`, a linked workspace
 * package not built on Reference UI, carries style-named props; `Panel` from
 * `@acme/panel`, a linked workspace package that imports `@reference-ui/react`,
 * is the own contrast; Reference's own `Div` is the control.
 */
import { Div } from '@reference-ui/react'
import { StarIcon } from '@acme/icons'
import { Panel } from '@acme/panel'

export function App() {
  return (
    <Div p="1r">
      <StarIcon color="red" size={16} />
      <Panel bg="blue" />
    </Div>
  )
}

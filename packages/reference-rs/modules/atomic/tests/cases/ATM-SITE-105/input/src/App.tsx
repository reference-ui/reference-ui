/**
 * Use sites for ATM-SITE-105: four styled component tags no trace admits.
 * `Badge` is a project component, `Panel` comes from a built workspace package
 * that borrows the app's runtime, and `UpstreamCard` and `Mystery` have no
 * binding at all (an MDX components map or a global provides them). Reference's
 * own `Div` is the control.
 */
import { Div } from '@reference-ui/react'
import { Badge } from './Badge'
import { Panel } from '@acme/panel'

export function App() {
  return (
    <Div p="1r">
      <Badge bg="red" />
      <Panel bg="blue" />
      <UpstreamCard p="2r" />
      <Mystery color="green" />
    </Div>
  )
}

/**
 * Use sites for ATM-SITE-96: `Button` from an installed package renders
 * through that package's runtime, while Reference's own `Button` is the
 * control that stays an own host under the same roster name.
 */
import { Button as OwnButton } from '@reference-ui/react'
import { Button } from 'acme-ui'

export function App() {
  return (
    <>
      <OwnButton bg="red" />
      <Button color="blue" />
    </>
  )
}

/**
 * Use sites for ATM-SITE-100: two package tags carry style props with no
 * composed system to back them, one package tag carries none, and Reference's
 * own `Div` is the control that always paints.
 */
import { Div } from '@reference-ui/react'
import { Button } from '@reference-ui/lib'
import { AcmeCard } from 'acme-ui'

export function App() {
  return (
    <Div p="1r">
      <Button color="blue" p="2r" />
      <AcmeCard bg="red" />
      <AcmeCard title="Plain" />
    </Div>
  )
}

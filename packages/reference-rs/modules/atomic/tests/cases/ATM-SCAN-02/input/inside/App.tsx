/**
 * Use sites for ATM-SCAN-02: Card and Wrapper are in scope; Other is
 * rendered without an import, so it extracts only when it is an entry.
 */
import { Card } from './Card'
import { Wrapper } from './Wrapper'

export function App() {
  return (
    <>
      <Card mt="4r" />
      <Wrapper mt="2r" />
      <Other p="1r" />
    </>
  )
}

/**
 * Use sites for ATM-SITE-57: Card traces through its sibling's failure,
 * ConfiguredHost is a host only by explicit jsxHosts, and own either way.
 */
import { Card } from './Card'

export function App() {
  return (
    <>
      <Card mt="4r" />
      <ConfiguredHost mt="2r" />
    </>
  )
}

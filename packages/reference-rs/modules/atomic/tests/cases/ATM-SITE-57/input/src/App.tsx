/**
 * Use sites for ATM-SITE-57: Card traces through its sibling's failure,
 * ConfiguredHost is admitted only by explicit jsxHosts.
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

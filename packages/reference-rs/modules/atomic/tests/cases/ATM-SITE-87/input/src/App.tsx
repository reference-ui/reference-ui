/**
 * Use sites for ATM-SITE-87: inline and const-spread member forms collect,
 * the List-coincidence control holds, and the alias-to-untraced use site
 * stays silent. Each mt value maps to exactly one use site.
 */
import { Tabs, TabPanel } from './tabs'

const panelLookMember = { mt: '7r', py: '5r' }
const lineTabMember = { pb: '3.5r', mb: '-1px' }

export function App() {
  return (
    <>
      <TabPanel mt="2r" value="a" />
      <Tabs.Panel mt="3r" value="a" />
      <Tabs.Panel {...panelLookMember} value="a" />
      <Tabs.Tab {...lineTabMember} value="a" />
      <Tabs.List mt="5r" />
      <Tabs.Plain mt="11r" label="x" />
    </>
  )
}

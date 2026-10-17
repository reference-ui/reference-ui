import { Div, P } from '@reference-ui/react'
import { Tabs } from '@reference-ui/lib'

/** Self-managed tabs: no value passed, so the first tab starts selected. */
export function TabsDemo() {
  return (
    <Div width="100%" maxWidth="100r">
      <Tabs>
        <Tabs.List aria-label="Settings">
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="billing">Billing</Tabs.Tab>
          <Tabs.Tab value="team">Team</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="general">
          <P>General settings.</P>
        </Tabs.Panel>
        <Tabs.Panel value="billing">
          <P>Billing settings.</P>
        </Tabs.Panel>
        <Tabs.Panel value="team">
          <P>Team settings.</P>
        </Tabs.Panel>
      </Tabs>
    </Div>
  )
}

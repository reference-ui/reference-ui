// Live Tabs demos for the Tabs component page.
// They take nothing and emit default, pill, and vertical tabs. Colocated with the page that
// embeds them.
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

/** The pill variant. */
export function TabsPillDemo() {
  return (
    <Div width="100%" maxWidth="100r">
      <Tabs variant="pill">
        <Tabs.List aria-label="Period">
          <Tabs.Tab value="day">Day</Tabs.Tab>
          <Tabs.Tab value="week">Week</Tabs.Tab>
          <Tabs.Tab value="month">Month</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="day">
          <P>Today's totals.</P>
        </Tabs.Panel>
        <Tabs.Panel value="week">
          <P>This week's totals.</P>
        </Tabs.Panel>
        <Tabs.Panel value="month">
          <P>This month's totals.</P>
        </Tabs.Panel>
      </Tabs>
    </Div>
  )
}

/** Vertical tabs: Up and Down arrows move between tabs. */
export function TabsVerticalDemo() {
  return (
    <Div width="100%" maxWidth="100r" display="flex" gap="6r">
      <Tabs orientation="vertical">
        <Tabs.List aria-label="Account">
          <Tabs.Tab value="profile">Profile</Tabs.Tab>
          <Tabs.Tab value="email">Email</Tabs.Tab>
          <Tabs.Tab value="password" disabled>
            Password
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="profile">
          <P>Name and photo.</P>
        </Tabs.Panel>
        <Tabs.Panel value="email">
          <P>Addresses and notifications.</P>
        </Tabs.Panel>
        <Tabs.Panel value="password">
          <P>Change your password.</P>
        </Tabs.Panel>
      </Tabs>
    </Div>
  )
}

import * as React from 'react'
import { Tabs } from '@reference-ui/lib'

export function TabsFixture() {
  const [value, setValue] = React.useState('account')

  return (
    <div data-testid="tabs-fixture-root">
      <h1>Tabs Fixture</h1>

      <Tabs value={value} onChange={setValue}>
        <Tabs.List data-testid="tabs-list">
          <Tabs.Tab value="account" data-testid="tab-account">
            Account
          </Tabs.Tab>
          <Tabs.Tab value="password" data-testid="tab-password">
            Password
          </Tabs.Tab>
          <Tabs.Tab value="settings" data-testid="tab-settings">
            Settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="account" data-testid="panel-account">
          <p>Account settings and profile information.</p>
        </Tabs.Panel>

        <Tabs.Panel value="password" data-testid="panel-password">
          <p>Change your password.</p>
        </Tabs.Panel>

        <Tabs.Panel value="settings" data-testid="panel-settings">
          <p>Manage application preferences.</p>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Tabs } from './index'

export const Horizontal = () => {
  const [value, setValue] = React.useState('account')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-fixture-root" maxW="100r">
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
            <Tabs.Tab value="disabled" data-testid="tab-disabled" disabled>
              Disabled
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="account" data-testid="panel-account">
            <Span fontSize="3.5r">Account settings and profile information.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="password" data-testid="panel-password">
            <Span fontSize="3.5r">Change your password and security keys.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="settings" data-testid="panel-settings">
            <Span fontSize="3.5r">Manage application preferences.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="disabled" data-testid="panel-disabled">
            <Span fontSize="3.5r">Disabled content.</Span>
          </Tabs.Panel>
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

export const Vertical = () => {
  const [value, setValue] = React.useState('general')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-vertical-root" maxW="120r">
        <Tabs value={value} onChange={setValue} orientation="vertical">
          <Div display="flex">
            <Tabs.List data-testid="tabs-vertical-list">
              <Tabs.Tab value="general" data-testid="tab-v-general">
                General
              </Tabs.Tab>
              <Tabs.Tab value="billing" data-testid="tab-v-billing">
                Billing
              </Tabs.Tab>
              <Tabs.Tab value="integrations" data-testid="tab-v-integrations">
                Integrations
              </Tabs.Tab>
            </Tabs.List>
            <Div flexGrow={1} p="4r">
              <Tabs.Panel value="general" data-testid="panel-v-general">
                <Span fontSize="3.5r">General workspace configuration.</Span>
              </Tabs.Panel>
              <Tabs.Panel value="billing" data-testid="panel-v-billing">
                <Span fontSize="3.5r">Invoices, payment methods, and plan limits.</Span>
              </Tabs.Panel>
              <Tabs.Panel value="integrations" data-testid="panel-v-integrations">
                <Span fontSize="3.5r">Third-party integrations and webhooks.</Span>
              </Tabs.Panel>
            </Div>
          </Div>
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

export const Pill = () => {
  const [value, setValue] = React.useState('overview')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-pill-root" maxW="100r">
        <Tabs value={value} onChange={setValue} variant="pill">
          <Tabs.List data-testid="tabs-pill-list">
            <Tabs.Tab value="overview" data-testid="tab-p-overview">
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="activity" data-testid="tab-p-activity">
              Activity
            </Tabs.Tab>
            <Tabs.Tab value="settings" data-testid="tab-p-settings">
              Settings
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="overview" data-testid="panel-p-overview">
            <Span fontSize="3.5r">High-level project overview.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="activity" data-testid="panel-p-activity">
            <Span fontSize="3.5r">Recent activity audit trail.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="settings" data-testid="panel-p-settings">
            <Span fontSize="3.5r">Team-wide workspace settings.</Span>
          </Tabs.Panel>
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

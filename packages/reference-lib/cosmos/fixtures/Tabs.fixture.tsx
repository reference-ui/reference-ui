import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Tabs } from '../../src/index'

export default {
  Horizontal: () => (
    <Div maxW="100r">
      <Tabs defaultValue="account">
        <Tabs.List>
          <Tabs.Tab value="account">Account</Tabs.Tab>
          <Tabs.Tab value="password">Password</Tabs.Tab>
          <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="account">
          <Span fontSize="3.5r">Account settings and preferences.</Span>
        </Tabs.Panel>
        <Tabs.Panel value="password">
          <Span fontSize="3.5r">Change password and security keys.</Span>
        </Tabs.Panel>
        <Tabs.Panel value="notifications">
          <Span fontSize="3.5r">Manage notification email and SMS alerts.</Span>
        </Tabs.Panel>
      </Tabs>
    </Div>
  ),
  Vertical: () => (
    <Div maxW="120r">
      <Tabs defaultValue="general" orientation="vertical">
        <Div display="flex">
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="billing">Billing</Tabs.Tab>
            <Tabs.Tab value="integrations">Integrations</Tabs.Tab>
          </Tabs.List>
          <Div flexGrow={1} p="4r">
            <Tabs.Panel value="general">
              <Span fontSize="3.5r">General workspace configuration.</Span>
            </Tabs.Panel>
            <Tabs.Panel value="billing">
              <Span fontSize="3.5r">Invoices, payment methods, and plan limits.</Span>
            </Tabs.Panel>
            <Tabs.Panel value="integrations">
              <Span fontSize="3.5r">Third-party integrations and webhooks.</Span>
            </Tabs.Panel>
          </Div>
        </Div>
      </Tabs>
    </Div>
  ),
}

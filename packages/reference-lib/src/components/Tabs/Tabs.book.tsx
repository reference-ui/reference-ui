import * as React from 'react'
import { A, Div, Span } from '@reference-ui/react'
import { Tabs, tabsListRecipe, tabsTabRecipe } from './index'

// Optional value (HQ EOD 2026-09-26 optional-value exception: `value`
// optional, omitted = self-managed from the first tab, no seeding
// prop); the Book stories stay controlled throughout.
// `variant` stays in the kernel (permanent API): line/pill ship prepackaged
// as system recipes, extended userland via normal css()/recipe().

function HorizontalTabs() {
  const [value, setValue] = React.useState('account')
  return (
    <Tabs value={value} onChange={setValue}>
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
  )
}

function VerticalTabs() {
  const [value, setValue] = React.useState('general')
  return (
    <Tabs value={value} onChange={setValue} orientation="vertical">
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
  )
}

function PillTabs() {
  const [value, setValue] = React.useState('overview')
  return (
    <Tabs value={value} onChange={setValue} variant="pill">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">
        <Span fontSize="3.5r">High-level project overview.</Span>
      </Tabs.Panel>
      <Tabs.Panel value="activity">
        <Span fontSize="3.5r">Recent activity audit trail.</Span>
      </Tabs.Panel>
      <Tabs.Panel value="settings">
        <Span fontSize="3.5r">Team-wide workspace settings.</Span>
      </Tabs.Panel>
    </Tabs>
  )
}

// Link-navigation recipe (FEATURES #9 — Book ONLY, no kernel API).
// Tabs look, links behave: real anchors in a nav landmark, so
// middle-click, open-in-tab, and one tab stop per link all work. There
// is deliberately no roving tabindex, no arrow handling, and no
// aria-selected — this is navigation, not the ARIA tab pattern. The
// current route gets aria-current="page".
//
// Styling: the tab look resolves through the kernel's own recipes — live
// calls, not pinned class names, so the recipe can never drift from the
// kernel look. (The pre-recipe version pinned atomic utilities by name;
// the recipe migration deleted that pinning with the inline props.)
const LINK_LIST_CLASS = tabsListRecipe({
  variant: 'line',
  orientation: 'horizontal',
})
const LINK_TAB_SELECTED_CLASS = tabsTabRecipe({
  variant: 'line',
  orientation: 'horizontal',
  selected: 'selected',
  disabled: 'enabled',
})
const LINK_TAB_UNSELECTED_CLASS = tabsTabRecipe({
  variant: 'line',
  orientation: 'horizontal',
  selected: 'unselected',
  disabled: 'enabled',
})

function LinkNavTabs() {
  // In your app `current` comes from the router (it re-renders after
  // navigation). Book simulates it with local state; the links are never
  // intercepted — no preventDefault anywhere.
  const [current, setCurrent] = React.useState('#/settings/billing')
  const links = [
    { href: '#/settings/general', label: 'General' },
    { href: '#/settings/billing', label: 'Billing' },
    { href: '#/settings/security', label: 'Security' },
  ]
  return (
    <nav aria-label="Settings">
      <Div
        className={LINK_LIST_CLASS}
        style={{ borderBottomColor: 'var(--colors-ui-table-border)' }}
      >
        {links.map(link => {
          const selected = current === link.href
          return (
            <A
              key={link.href}
              href={link.href}
              aria-current={selected ? 'page' : undefined}
              onClick={() => setCurrent(link.href)}
              className={selected ? LINK_TAB_SELECTED_CLASS : LINK_TAB_UNSELECTED_CLASS}
              style={{ textDecoration: 'none' }}
            >
              {link.label}
            </A>
          )
        })}
      </Div>
    </nav>
  )
}

export default {
  Horizontal: () => (
    <Div maxW="100r">
      <HorizontalTabs />
    </Div>
  ),
  Vertical: () => (
    <Div maxW="120r">
      <VerticalTabs />
    </Div>
  ),
  Pill: () => (
    <Div maxW="100r">
      <PillTabs />
    </Div>
  ),
  LinkNav: () => (
    <Div maxW="100r">
      <LinkNavTabs />
    </Div>
  ),
}

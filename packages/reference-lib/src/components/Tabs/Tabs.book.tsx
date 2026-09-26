import * as React from 'react'
import { A, Div, Span } from '@reference-ui/react'
import { Tabs } from './index'

// Controlled throughout (FEATURES #1 ships required `value`; there is no
// `defaultValue`). `variant` stays in the kernel — the stylesheet
// collector cannot reliably deliver Book-side token styles, so the pill
// look has no other collectible home.

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
// Styling: the tab look reuses the kernel's own utility classes by name.
// Consumer-side token styles (spreads, inline props) are invisible to
// the stylesheet collector, so a recipe cannot regenerate them — but it
// CAN reference the classes the kernel's inline props already collect.
// Pinned to the namer output; revisit if the kernel look changes.
const LINK_LIST_CLASS =
  'reference-ui__d_flex reference-ui__flex-dir_row reference-ui__gap_4r reference-ui__bd-b-w_1px reference-ui__bd-b-s_solid reference-ui__bd-b-c_ui.table.border reference-ui__bg_transparent reference-ui__p_0 reference-ui__pos_relative'
const LINK_TAB_BASE =
  'reference-ui__h_auto reference-ui__px_2r reference-ui__pt_2.5r reference-ui__pb_3.5r reference-ui__bd_none reference-ui__bd-b-w_3px reference-ui__bd-b-s_solid reference-ui__mb_-1px reference-ui__rounded_0 reference-ui__cursor_pointer reference-ui__bg_transparent reference-ui__font-weight_500 reference-ui__fs_3.5r reference-ui__shadow_none reference-ui__op_1 reference-ui__trans_color_150ms_ease,_border-color_150ms_ease,_background-color_150ms_ease reference-ui__focusVisible:outline-w_2px reference-ui__focusVisible:outline-s_solid reference-ui__focusVisible:outline-c_ui.focus.ring reference-ui__focusVisible:outline-offset_-2px'
const LINK_TAB_SELECTED_EXTRA =
  'reference-ui__bd-c_ui.focus.ring reference-ui__c_design.text.base reference-ui__text-shadow_0_0_0.4px_currentColor'
const LINK_TAB_UNSELECTED_EXTRA =
  'reference-ui__bd-b-c_transparent reference-ui__bd-c_transparent reference-ui__c_design.text.light reference-ui__hover:c_design.text.base reference-ui__hover:bd-c_ui.field.border'

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
              className={`${LINK_TAB_BASE} ${selected ? LINK_TAB_SELECTED_EXTRA : LINK_TAB_UNSELECTED_EXTRA}`}
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

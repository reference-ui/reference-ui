import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Div, Span, css } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Tabs } from './index'
import { MyTabsList, MyTabsTab } from './MyTabs'

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

export const Manual = () => {
  const [value, setValue] = React.useState('preview')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-manual-root" maxW="100r">
        <Tabs value={value} onChange={setValue} activation="manual">
          <Tabs.List data-testid="tabs-manual-list">
            <Tabs.Tab value="preview" data-testid="tab-m-preview">
              Preview
            </Tabs.Tab>
            <Tabs.Tab value="history" data-testid="tab-m-history" disabled>
              History
            </Tabs.Tab>
            <Tabs.Tab value="source" data-testid="tab-m-source">
              Source
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="preview" data-testid="panel-m-preview">
            <Span fontSize="3.5r">Live preview output.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="history" data-testid="panel-m-history">
            <Span fontSize="3.5r">Revision history.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="source" data-testid="panel-m-source">
            <Span fontSize="3.5r">Editable source.</Span>
          </Tabs.Panel>
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

export const Rtl = () => {
  const [value, setValue] = React.useState('billing')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-rtl-root" maxW="100r" dir="rtl">
        <Tabs value={value} onChange={setValue}>
          <Tabs.List data-testid="tabs-rtl-list">
            <Tabs.Tab value="general" data-testid="tab-r-general">
              General
            </Tabs.Tab>
            <Tabs.Tab value="billing" data-testid="tab-r-billing">
              Billing
            </Tabs.Tab>
            <Tabs.Tab value="security" data-testid="tab-r-security">
              Security
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general" data-testid="panel-r-general">
            <Span fontSize="3.5r">General settings.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="billing" data-testid="panel-r-billing">
            <Span fontSize="3.5r">Billing settings.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="security" data-testid="panel-r-security">
            <Span fontSize="3.5r">Security settings.</Span>
          </Tabs.Panel>
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

export const Nested = () => {
  const [outer, setOuter] = React.useState('general')
  const [inner, setInner] = React.useState('a')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-nested-root" maxW="100r">
        <Tabs value={outer} onChange={setOuter}>
          <Tabs.List data-testid="tabs-nested-outer-list">
            <Tabs.Tab value="general" data-testid="tab-n-outer-general">
              General
            </Tabs.Tab>
            <Tabs.Tab value="billing" data-testid="tab-n-outer-billing">
              Billing
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general" data-testid="panel-n-outer-general">
            <Tabs value={inner} onChange={setInner}>
              <Tabs.List data-testid="tabs-nested-inner-list">
                <Tabs.Tab value="a" data-testid="tab-n-inner-a">
                  A
                </Tabs.Tab>
                <Tabs.Tab value="b" data-testid="tab-n-inner-b">
                  B
                </Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="a" data-testid="panel-n-inner-a">
                <Span fontSize="3.5r">Inner A content.</Span>
              </Tabs.Panel>
              <Tabs.Panel value="b" data-testid="panel-n-inner-b">
                <Span fontSize="3.5r">Inner B content.</Span>
              </Tabs.Panel>
            </Tabs>
          </Tabs.Panel>
          <Tabs.Panel value="billing" data-testid="panel-n-outer-billing">
            <Span fontSize="3.5r">Outer billing content.</Span>
          </Tabs.Panel>
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

export const ShadowTabs = () => {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const [shadowRoot, setShadowRoot] = React.useState<ShadowRoot | null>(null)
  const [value, setValue] = React.useState('general')
  const [requests, setRequests] = React.useState<string[]>([])

  React.useEffect(() => {
    const host = hostRef.current
    if (host && !host.shadowRoot) {
      setShadowRoot(host.attachShadow({ mode: 'open' }))
    }
  }, [])

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-shadow-root" maxW="100r">
        <div ref={hostRef} data-testid="tabs-shadow-host" />
        <Div data-testid="tabs-shadow-log">{requests.join(',')}</Div>
        {shadowRoot &&
          ReactDOM.createPortal(
            <Tabs
              value={value}
              activation="manual"
              onChange={(next: string) => {
                setRequests(prev => [...prev, next])
                setValue(next)
              }}
            >
              <Tabs.List>
                <Tabs.Tab value="general" data-testid="tab-s-general">
                  General
                </Tabs.Tab>
                <Tabs.Tab value="billing" data-testid="tab-s-billing">
                  Billing
                </Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="general" data-testid="panel-s-general">
                <Span fontSize="3.5r">General settings.</Span>
              </Tabs.Panel>
              <Tabs.Panel value="billing" data-testid="panel-s-billing">
                <Span fontSize="3.5r">Billing settings.</Span>
              </Tabs.Panel>
            </Tabs>,
            shadowRoot as unknown as Element
          )}
      </Div>
    </ReferenceLibrary>
  )
}

export const FocusRescue = () => {
  const [value, setValue] = React.useState('general')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-rescue-root" maxW="100r">
        {/* Fixture control: mousedown-prevented so the click never steals
            focus from the panel input under test. */}
        <button
          type="button"
          data-testid="rescue-switch"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setValue('billing')}
        >
          Switch to billing
        </button>
        <Tabs value={value} onChange={setValue}>
          <Tabs.List>
            <Tabs.Tab value="general" data-testid="tab-f-general">
              General
            </Tabs.Tab>
            <Tabs.Tab value="billing" data-testid="tab-f-billing">
              Billing
            </Tabs.Tab>
            <Tabs.Tab value="security" data-testid="tab-f-security">
              Security
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general" data-testid="panel-f-general">
            <input data-testid="panel-f-input" aria-label="Panel input" />
          </Tabs.Panel>
          <Tabs.Panel value="billing" data-testid="panel-f-billing">
            <Span fontSize="3.5r">Billing settings.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="security" data-testid="panel-f-security">
            <Span fontSize="3.5r">Security settings.</Span>
          </Tabs.Panel>
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

export const Handoff = () => {
  const [value, setValue] = React.useState('general')
  const [disabledBilling, setDisabledBilling] = React.useState(false)
  const [removedBilling, setRemovedBilling] = React.useState(false)
  const order = ['general', 'billing', 'security', 'archive'].filter(
    v => !(v === 'billing' && removedBilling)
  )

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-handoff-root" maxW="100r">
        {/* Fixture controls: mousedown-prevented so neither click steals
            focus from the tab under test. */}
        <button
          type="button"
          data-testid="handoff-disable"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setDisabledBilling(true)}
        >
          Disable billing
        </button>
        <button
          type="button"
          data-testid="handoff-remove"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setRemovedBilling(true)}
        >
          Remove billing
        </button>
        <Tabs value={value} onChange={setValue} activation="manual">
          <Tabs.List>
            {order.map(v => (
              <Tabs.Tab
                key={v}
                value={v}
                data-testid={`tab-h-${v}`}
                disabled={v === 'billing' && disabledBilling}
              >
                {v}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {order.map(v => (
            <Tabs.Panel key={v} value={v} data-testid={`panel-h-${v}`}>
              <Span fontSize="3.5r">{v} content.</Span>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

export const MyTabs = () => {
  const [value, setValue] = React.useState('overview')
  const [lineValue, setLineValue] = React.useState('alpha')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-mytabs-root" maxW="100r">
        {/* Custom typed variant: userland recipes, kernel composition. */}
        <Tabs value={value} onChange={setValue}>
          <MyTabsList data-testid="tabs-mytabs-list">
            <MyTabsTab
              value="overview"
              selected={value === 'overview'}
              data-testid="tab-my-overview"
            >
              Overview
            </MyTabsTab>
            <MyTabsTab
              value="activity"
              selected={value === 'activity'}
              data-testid="tab-my-activity"
            >
              Activity
            </MyTabsTab>
            <MyTabsTab
              value="settings"
              selected={value === 'settings'}
              data-testid="tab-my-settings"
            >
              Settings
            </MyTabsTab>
          </MyTabsList>
          <Tabs.Panel value="overview" data-testid="panel-my-overview">
            <Span fontSize="3.5r">High-level project overview.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="activity" data-testid="panel-my-activity">
            <Span fontSize="3.5r">Recent activity audit trail.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="settings" data-testid="panel-my-settings">
            <Span fontSize="3.5r">Team-wide workspace settings.</Span>
          </Tabs.Panel>
        </Tabs>
        {/* Built-in override: css() compiles to utilities, which beat the
            kernel recipe classes by layer order — no variants API needed. */}
        <Tabs value={lineValue} onChange={setLineValue}>
          <Tabs.List data-testid="tabs-my-override-list">
            <Tabs.Tab
              value="alpha"
              className={css({ color: 'red.500' })}
              data-testid="tab-my-override"
            >
              Overridden
            </Tabs.Tab>
            <Tabs.Tab value="beta" data-testid="tab-my-plain">
              Plain
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="alpha" data-testid="panel-my-alpha">
            <Span fontSize="3.5r">Alpha content.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="beta" data-testid="panel-my-beta">
            <Span fontSize="3.5r">Beta content.</Span>
          </Tabs.Panel>
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

export const KeepMounted = () => {
  const [value, setValue] = React.useState('general')

  return (
    <ReferenceLibrary>
      <Div p="6r" colorMode="dark" data-testid="tabs-keep-root" maxW="100r">
        <Tabs value={value} onChange={setValue} keepMounted>
          <Tabs.List data-testid="tabs-keep-list">
            <Tabs.Tab value="general" data-testid="tab-k-general">
              General
            </Tabs.Tab>
            <Tabs.Tab value="billing" data-testid="tab-k-billing">
              Billing
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general" data-testid="panel-k-general">
            <Span fontSize="3.5r">General settings.</Span>
          </Tabs.Panel>
          <Tabs.Panel value="billing" data-testid="panel-k-billing">
            <input data-testid="panel-k-input" defaultValue="" aria-label="Billing note" />
          </Tabs.Panel>
        </Tabs>
      </Div>
    </ReferenceLibrary>
  )
}

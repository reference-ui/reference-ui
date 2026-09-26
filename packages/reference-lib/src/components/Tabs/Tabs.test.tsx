// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Tabs } from './Tabs'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

function keydown(el: Element, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

function tabIndexOf(id: string) {
  return document.getElementById(id)?.getAttribute('tabindex')
}

describe('Tabs component indicator styling and stability', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'tabs-root'
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('renders tabs with 3px indicator on active tab and table-border baseline on list', async () => {
    await React.act(async () => {
      root.render(
        <Tabs defaultValue="account">
          <Tabs.List id="tabs-list">
            <Tabs.Trigger id="tab-account" value="account">
              Account
            </Tabs.Trigger>
            <Tabs.Trigger id="tab-password" value="password">
              Password
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="account">Account content</Tabs.Content>
          <Tabs.Content value="password">Password content</Tabs.Content>
        </Tabs>
      )
    })

    const tabsList = document.getElementById('tabs-list')
    const activeTab = document.getElementById('tab-account')
    const inactiveTab = document.getElementById('tab-password')

    // Tabs.List uses explicit faint ui.table.border instead of currentcolor
    expect(tabsList?.style.borderBottomColor).toBe('var(--colors-ui-table-border)')

    // States
    expect(activeTab?.getAttribute('data-state')).toBe('active')
    expect(activeTab?.getAttribute('aria-selected')).toBe('true')
    expect(inactiveTab?.getAttribute('data-state')).toBe('inactive')
    expect(inactiveTab?.getAttribute('aria-selected')).toBe('false')

    // Switching tab updates active state
    await React.act(async () => {
      inactiveTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(activeTab?.getAttribute('data-state')).toBe('inactive')
    expect(inactiveTab?.getAttribute('data-state')).toBe('active')
  })

  it('renders pill variant tabs with primary button styling on active tab', async () => {
    await React.act(async () => {
      root.render(
        <Tabs defaultValue="overview" variant="pill">
          <Tabs.List id="tabs-list-pill">
            <Tabs.Trigger id="tab-overview" value="overview">
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger id="tab-activity" value="activity">
              Activity
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="overview">Overview content</Tabs.Content>
          <Tabs.Content value="activity">Activity content</Tabs.Content>
        </Tabs>
      )
    })

    const tabsList = document.getElementById('tabs-list-pill')
    const activeTab = document.getElementById('tab-overview')
    const inactiveTab = document.getElementById('tab-activity')

    expect(tabsList?.className).toContain('bg_ui.tab.track.background')
    expect(activeTab?.className).toContain('bg_gray.200')
    expect(activeTab?.className).toContain('c_ui.button.foreground')
    expect(inactiveTab?.className).toContain('bg_transparent')
    expect(inactiveTab?.className).toContain('c_design.text.light')
  })
})

describe('Tabs stability proofs (quarantine-landing ports)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  function Trio({
    log,
    accept = true,
    initial = 'general',
    ...tabsProps
  }: {
    log: string[]
    accept?: boolean
    initial?: string
    orientation?: 'horizontal' | 'vertical'
    activation?: 'automatic' | 'manual'
  }) {
    const [value, setValue] = React.useState(initial)
    return (
      <Tabs
        value={value}
        onChange={(next: string) => {
          log.push(next)
          if (accept) setValue(next)
        }}
        {...tabsProps}
      >
        <Tabs.List>
          <Tabs.Tab id="t-general" value="general">
            General
          </Tabs.Tab>
          <Tabs.Tab id="t-billing" value="billing">
            Billing
          </Tabs.Tab>
          <Tabs.Tab id="t-security" value="security">
            Security
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="p-general" value="general">
          General content
        </Tabs.Panel>
        <Tabs.Panel id="p-billing" value="billing">
          Billing content
        </Tabs.Panel>
        <Tabs.Panel id="p-security" value="security">
          Security content
        </Tabs.Panel>
      </Tabs>
    )
  }

  it('TB-DOM-03: exactly one tab stop tracks the controlled selection', async () => {
    const log: string[] = []
    function Fixture() {
      const [value, setValue] = React.useState('general')
      return (
        <Tabs
          value={value}
          onChange={(next: string) => {
            log.push(next)
            setValue(next)
          }}
        >
          <Tabs.List>
            <Tabs.Tab id="t-general" value="general">
              General
            </Tabs.Tab>
            <Tabs.Tab id="t-billing" value="billing">
              Billing
            </Tabs.Tab>
            <Tabs.Tab id="t-security" value="security">
              Security
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">General content</Tabs.Panel>
          <Tabs.Panel value="billing">Billing content</Tabs.Panel>
          <Tabs.Panel value="security">Security content</Tabs.Panel>
        </Tabs>
      )
    }
    await React.act(async () => {
      root.render(<Fixture />)
    })

    expect(tabIndexOf('t-general')).toBe('0')
    expect(tabIndexOf('t-billing')).toBe('-1')
    expect(tabIndexOf('t-security')).toBe('-1')

    await React.act(async () => {
      click(document.getElementById('t-security')!)
    })

    expect(tabIndexOf('t-general')).toBe('-1')
    expect(tabIndexOf('t-security')).toBe('0')
    expect(log).toEqual(['security'])
  })

  it('TB-DOM-07: separate instances reusing values keep unique stable IDs', async () => {
    function Two() {
      return (
        <>
          <Tabs defaultValue="general">
            <Tabs.List>
              <Tabs.Tab value="general">General</Tabs.Tab>
              <Tabs.Tab value="billing">Billing</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general">G1</Tabs.Panel>
            <Tabs.Panel value="billing">B1</Tabs.Panel>
          </Tabs>
          <Tabs defaultValue="general">
            <Tabs.List>
              <Tabs.Tab value="general">General</Tabs.Tab>
              <Tabs.Tab value="billing">Billing</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general">G2</Tabs.Panel>
            <Tabs.Panel value="billing">B2</Tabs.Panel>
          </Tabs>
        </>
      )
    }
    await React.act(async () => {
      root.render(<Two />)
    })

    const snapshot = () =>
      Array.from(container.querySelectorAll('[role="tab"], [role="tabpanel"]')).map(
        el => el.id
      )
    const before = snapshot()
    expect(before.length).toBe(8)
    expect(new Set(before).size).toBe(8)

    await React.act(async () => {
      root.render(<Two />)
    })
    expect(snapshot()).toEqual(before)

    // Every ARIA reference resolves inside its own instance.
    // (Generated IDs are [A-Za-z0-9-_] only, so no CSS escaping is needed.)
    for (const tab of Array.from(container.querySelectorAll('[role="tab"]'))) {
      const controls = tab.getAttribute('aria-controls')
      if (controls) {
        const panel = container.querySelector(`#${controls}`)
        expect(panel?.getAttribute('role')).toBe('tabpanel')
      }
    }
    for (const panel of Array.from(
      container.querySelectorAll('[role="tabpanel"]')
    )) {
      const labelledBy = panel.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      const tab = labelledBy && container.querySelector(`#${labelledBy}`)
      expect(tab?.getAttribute('role')).toBe('tab')
    }
  })

  it('TB-DOM-08: a disabled tab is inert to clicks and skipped by arrows', async () => {
    const log: string[] = []
    function Fixture() {
      const [value, setValue] = React.useState('general')
      return (
        <Tabs
          value={value}
          onChange={(next: string) => {
            log.push(next)
            setValue(next)
          }}
        >
          <Tabs.List>
            <Tabs.Tab id="t-general" value="general">
              General
            </Tabs.Tab>
            <Tabs.Tab id="t-billing" value="billing" disabled>
              Billing
            </Tabs.Tab>
            <Tabs.Tab id="t-security" value="security">
              Security
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">G</Tabs.Panel>
          <Tabs.Panel value="billing">B</Tabs.Panel>
          <Tabs.Panel value="security">S</Tabs.Panel>
        </Tabs>
      )
    }
    await React.act(async () => {
      root.render(<Fixture />)
    })

    const billing = document.getElementById('t-billing')!
    expect((billing as HTMLButtonElement).disabled).toBe(true)
    expect(billing.getAttribute('data-disabled')).toBe('')
    expect(tabIndexOf('t-billing')).toBe('-1')

    await React.act(async () => {
      click(billing)
    })
    expect(log).toEqual([])

    await React.act(async () => {
      document.getElementById('t-general')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-security')
    expect(log).toEqual(['security'])
  })

  it('TB-DOM-10: duplicate Tab or Panel values throw a descriptive error', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      async function expectThrow(node: React.ReactNode, pattern: RegExp) {
        const div = document.createElement('div')
        document.body.appendChild(div)
        const localRoot = createRoot(div)
        try {
          await expect(
            React.act(async () => {
              localRoot.render(node)
            })
          ).rejects.toThrow(pattern)
        } finally {
          await React.act(async () => {
            localRoot.unmount()
          })
          div.remove()
        }
      }

      await expectThrow(
        <Tabs value="general">
          <Tabs.List>
            <Tabs.Tab value="general">G1</Tabs.Tab>
            <Tabs.Tab value="general">G2</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">G</Tabs.Panel>
        </Tabs>,
        /duplicate Tab value "general"/
      )
      await expectThrow(
        <Tabs value="general">
          <Tabs.List>
            <Tabs.Tab value="general">G</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">G1</Tabs.Panel>
          <Tabs.Panel value="general">G2</Tabs.Panel>
        </Tabs>,
        /duplicate Panel value "general"/
      )
    } finally {
      errors.mockRestore()
    }
  })

  it('TB-DOM-11: all-disabled tabs expose no tab stop and emit nothing', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(
        <Tabs value="billing" onChange={(next: string) => log.push(next)}>
          <Tabs.List>
            <Tabs.Tab id="t-general" value="general" disabled>
              General
            </Tabs.Tab>
            <Tabs.Tab id="t-billing" value="billing" disabled>
              Billing
            </Tabs.Tab>
            <Tabs.Tab id="t-security" value="security" disabled>
              Security
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="p-billing" value="billing">
            Billing content
          </Tabs.Panel>
        </Tabs>
      )
    })

    expect(tabIndexOf('t-general')).toBe('-1')
    expect(tabIndexOf('t-billing')).toBe('-1')
    expect(tabIndexOf('t-security')).toBe('-1')
    // The controlled panel may still show for the disabled value.
    expect(document.getElementById('p-billing')?.hidden).toBe(false)

    await React.act(async () => {
      click(document.getElementById('t-general')!)
      click(document.getElementById('t-security')!)
    })
    expect(log).toEqual([])
  })

  it('TB-DOM-12: omitted orientation and activation default to horizontal automatic', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<Trio log={log} accept={false} />)
    })

    await React.act(async () => {
      document.getElementById('t-general')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-billing')
    expect(tabIndexOf('t-billing')).toBe('0')
    expect(log).toEqual(['billing'])
  })

  it('TB-DOM-14: tabs default to type=button and honor an explicit type override', async () => {
    await React.act(async () => {
      root.render(
        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab id="t-general" value="general">
              General
            </Tabs.Tab>
            <Tabs.Tab id="t-billing" value="billing" type="submit">
              Billing
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">G</Tabs.Panel>
          <Tabs.Panel value="billing">B</Tabs.Panel>
        </Tabs>
      )
    })

    expect(document.getElementById('t-general')?.getAttribute('type')).toBe('button')
    expect(document.getElementById('t-billing')?.getAttribute('type')).toBe('submit')
  })

  it('TB-SELECT-04: clicks on the selected or a disabled tab request nothing', async () => {
    const log: string[] = []
    function Fixture() {
      const [value, setValue] = React.useState('general')
      return (
        <Tabs
          value={value}
          onChange={(next: string) => {
            log.push(next)
            setValue(next)
          }}
        >
          <Tabs.List>
            <Tabs.Tab id="t-general" value="general">
              General
            </Tabs.Tab>
            <Tabs.Tab id="t-billing" value="billing" disabled>
              Billing
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">G</Tabs.Panel>
          <Tabs.Panel value="billing">B</Tabs.Panel>
        </Tabs>
      )
    }
    await React.act(async () => {
      root.render(<Fixture />)
    })

    await React.act(async () => {
      click(document.getElementById('t-general')!)
      click(document.getElementById('t-general')!)
      click(document.getElementById('t-billing')!)
    })
    expect(log).toEqual([])
    expect(
      document.getElementById('t-general')?.getAttribute('aria-selected')
    ).toBe('true')
  })

  it('TB-MANUAL-01: manual arrows move focus and the tab stop without selecting', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<Trio log={log} accept={false} activation="manual" />)
    })

    await React.act(async () => {
      document.getElementById('t-general')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-billing')
    expect(tabIndexOf('t-general')).toBe('-1')
    expect(tabIndexOf('t-billing')).toBe('0')
    expect(log).toEqual([])
    expect(
      document.getElementById('t-general')?.getAttribute('aria-selected')
    ).toBe('true')
    expect(document.getElementById('p-general')?.hidden).toBe(false)

    await React.act(async () => {
      keydown(document.activeElement!, 'End')
    })
    expect(document.activeElement?.id).toBe('t-security')
    expect(tabIndexOf('t-security')).toBe('0')
    expect(log).toEqual([])

    await React.act(async () => {
      keydown(document.activeElement!, 'Home')
    })
    expect(document.activeElement?.id).toBe('t-general')
    expect(log).toEqual([])

    // Explicit activation requests the focused value exactly once.
    await React.act(async () => {
      keydown(document.activeElement!, 'ArrowRight')
      click(document.activeElement!)
    })
    expect(log).toEqual(['billing'])
  })

  it('TB-MANUAL-04: manual activation of the selected tab requests nothing', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<Trio log={log} activation="manual" />)
    })

    await React.act(async () => {
      document.getElementById('t-general')!.focus()
      click(document.activeElement!)
    })
    expect(log).toEqual([])
    expect(tabIndexOf('t-general')).toBe('0')
  })

  it('TB-AUTO-02 + TB-AUTO-06: horizontal arrows reverse under inherited RTL, live', async () => {
    const log: string[] = []
    function Rtl({ dir }: { dir: 'rtl' | 'ltr' }) {
      const [value, setValue] = React.useState('billing')
      return (
        <div dir={dir}>
          <Tabs
            value={value}
            onChange={(next: string) => {
              log.push(next)
              setValue(next)
            }}
          >
            <Tabs.List>
              <Tabs.Tab id="t-general" value="general">
                General
              </Tabs.Tab>
              <Tabs.Tab id="t-billing" value="billing">
                Billing
              </Tabs.Tab>
              <Tabs.Tab id="t-security" value="security">
                Security
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general">G</Tabs.Panel>
            <Tabs.Panel value="billing">B</Tabs.Panel>
            <Tabs.Panel value="security">S</Tabs.Panel>
          </Tabs>
        </div>
      )
    }
    await React.act(async () => {
      root.render(<Rtl dir="rtl" />)
    })

    await React.act(async () => {
      document.getElementById('t-billing')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-general')
    expect(log).toEqual(['general'])

    await React.act(async () => {
      keydown(document.activeElement!, 'ArrowLeft')
    })
    expect(document.activeElement?.id).toBe('t-billing')

    // Runtime direction flip applies to the next keypress (TB-AUTO-06).
    await React.act(async () => {
      root.render(<Rtl dir="ltr" />)
    })
    log.length = 0
    await React.act(async () => {
      document.getElementById('t-billing')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-security')
    expect(log).toEqual(['security'])
  })

  it('TB-NEST-01: nested instances isolate arrow movement in both directions', async () => {
    const outerLog: string[] = []
    const innerLog: string[] = []
    function Nested() {
      const [outer, setOuter] = React.useState('general')
      const [inner, setInner] = React.useState('a')
      return (
        <Tabs
          value={outer}
          onChange={(next: string) => {
            outerLog.push(next)
            setOuter(next)
          }}
        >
          <Tabs.List>
            <Tabs.Tab id="t-outer-general" value="general">
              General
            </Tabs.Tab>
            <Tabs.Tab id="t-outer-billing" value="billing">
              Billing
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">
            <Tabs
              value={inner}
              onChange={(next: string) => {
                innerLog.push(next)
                setInner(next)
              }}
            >
              <Tabs.List>
                <Tabs.Tab id="t-inner-a" value="a">
                  A
                </Tabs.Tab>
                <Tabs.Tab id="t-inner-b" value="b">
                  B
                </Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="a">A content</Tabs.Panel>
              <Tabs.Panel value="b">B content</Tabs.Panel>
            </Tabs>
          </Tabs.Panel>
          <Tabs.Panel value="billing">Billing content</Tabs.Panel>
        </Tabs>
      )
    }
    await React.act(async () => {
      root.render(<Nested />)
    })

    // Inner arrows stay inner.
    await React.act(async () => {
      document.getElementById('t-inner-a')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-inner-b')
    expect(innerLog).toEqual(['b'])
    expect(outerLog).toEqual([])

    // Outer arrows skip over nested tabs.
    await React.act(async () => {
      document.getElementById('t-outer-general')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-outer-billing')
    expect(outerLog).toEqual(['billing'])
    expect(innerLog).toEqual(['b'])
  })

  it('TB-EVENT-03: printable keys move neither focus nor selection', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<Trio log={log} accept={false} />)
    })

    await React.act(async () => {
      document.getElementById('t-general')!.focus()
      keydown(document.activeElement!, 'b')
      keydown(document.activeElement!, 's')
    })
    expect(document.activeElement?.id).toBe('t-general')
    expect(tabIndexOf('t-general')).toBe('0')
    expect(log).toEqual([])
  })

  it('TB-ENV-01: server render emits deterministic linked markup', async () => {
    function SSR() {
      return (
        <Tabs value="billing">
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="billing">Billing</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">G</Tabs.Panel>
          <Tabs.Panel value="billing">B</Tabs.Panel>
        </Tabs>
      )
    }
    const first = renderToString(<SSR />)
    const second = renderToString(<SSR />)
    // Deterministic across renders: same IDs, same linkage.
    expect(second).toBe(first)

    // Selected-only aria-controls, hidden inactive panel, labelledby pairs.
    expect(first).toContain('aria-selected="true"')
    const controls = first.match(/aria-controls="([^"]+)"/g) ?? []
    expect(controls.length).toBe(1)
    const panelId = controls[0].match(/aria-controls="([^"]+)"/)![1]
    expect(first).toContain(`id="${panelId}"`)
    expect(first).toContain('hidden')
    const labelled = first.match(/aria-labelledby="([^"]+)"/g) ?? []
    expect(labelled.length).toBe(2)
    for (const attr of labelled) {
      const tabId = attr.match(/aria-labelledby="([^"]+)"/)![1]
      expect(first).toContain(`id="${tabId}"`)
    }
  })

  it('Uncontrolled mode is preserved: defaultValue selects and switches with no value prop', async () => {
    await React.act(async () => {
      root.render(
        <Tabs defaultValue="account">
          <Tabs.List>
            <Tabs.Tab id="t-account" value="account">
              Account
            </Tabs.Tab>
            <Tabs.Tab id="t-password" value="password">
              Password
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="p-account" value="account">
            Account content
          </Tabs.Panel>
          <Tabs.Panel id="p-password" value="password">
            Password content
          </Tabs.Panel>
        </Tabs>
      )
    })

    expect(
      document.getElementById('t-account')?.getAttribute('aria-selected')
    ).toBe('true')
    expect(tabIndexOf('t-account')).toBe('0')

    await React.act(async () => {
      click(document.getElementById('t-password')!)
    })
    expect(
      document.getElementById('t-password')?.getAttribute('aria-selected')
    ).toBe('true')
    expect(document.getElementById('p-password')?.hidden).toBe(false)
    expect(document.getElementById('p-account')?.hidden).toBe(true)

    // Automatic arrows switch the uncontrolled selection too.
    await React.act(async () => {
      document.getElementById('t-password')!.focus()
      keydown(document.activeElement!, 'ArrowLeft')
    })
    expect(document.activeElement?.id).toBe('t-account')
    expect(
      document.getElementById('t-account')?.getAttribute('aria-selected')
    ).toBe('true')
  })
})

describe('Tabs PATCHES proofs (identity registry)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  function expectLinked(tabId: string, panelId: string) {
    const tab = document.getElementById(tabId)
    const panel = document.getElementById(panelId)
    expect(tab?.getAttribute('role')).toBe('tab')
    expect(panel?.getAttribute('role')).toBe('tabpanel')
    // Selected-only aria-controls: only assert when the tab carries one.
    const controls = tab?.getAttribute('aria-controls')
    if (controls) {
      expect(controls).toBe(panelId)
      expect(document.getElementById(controls)?.getAttribute('role')).toBe(
        'tabpanel'
      )
    }
    const labelledBy = panel?.getAttribute('aria-labelledby')
    expect(labelledBy).toBe(tabId)
    expect(document.getElementById(labelledBy!)?.getAttribute('role')).toBe(
      'tab'
    )
  }

  it('TB-DOM-06: explicit Tab and Panel IDs win on both sides of the linkage', async () => {
    function Fixture({ tabId, panelId }: { tabId: string; panelId: string }) {
      return (
        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab id={tabId} value="general">
              General
            </Tabs.Tab>
            <Tabs.Tab value="billing">Billing</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id={panelId} value="general">
            G
          </Tabs.Panel>
          <Tabs.Panel value="billing">B</Tabs.Panel>
        </Tabs>
      )
    }
    await React.act(async () => {
      root.render(<Fixture tabId="tab-general" panelId="panel-general" />)
    })

    // Explicit IDs win over the generated pair on both references.
    expectLinked('tab-general', 'panel-general')
    // The generated pair stays linked through the registry fallback.
    const billingPanel = container.querySelector(
      '[role="tabpanel"][data-value="billing"]'
    )!
    const billingLabelledBy = billingPanel.getAttribute('aria-labelledby')!
    expect(
      document.getElementById(billingLabelledBy)?.getAttribute('role')
    ).toBe('tab')

    // Rerender each ID: both references update together, old IDs vanish,
    // nothing dangles. (Registry subscription is a layout effect, so in a
    // real browser the update lands before paint — no dangling frame.)
    await React.act(async () => {
      root.render(<Fixture tabId="tab-profile" panelId="panel-profile" />)
    })
    expect(document.getElementById('tab-general')).toBeNull()
    expect(document.getElementById('panel-general')).toBeNull()
    expectLinked('tab-profile', 'panel-profile')
  })

  it('TB-DYNAMIC-01: insert and reorder keep selection, IDs, and focus on survivors', async () => {
    const log: string[] = []
    function Fixture({ order }: { order: string[] }) {
      const [value, setValue] = React.useState('billing')
      return (
        <Tabs
          value={value}
          onChange={(next: string) => {
            log.push(next)
            setValue(next)
          }}
        >
          <Tabs.List>
            {order.map(v => (
              <Tabs.Tab key={v} value={v}>
                {v}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {order.map(v => (
            <Tabs.Panel key={v} value={v}>
              {v} content
            </Tabs.Panel>
          ))}
        </Tabs>
      )
    }
    const idsFor = (value: string) => ({
      tab: container.querySelector(`[role="tab"][data-value="${value}"]`)!.id,
      panel: container.querySelector(
        `[role="tabpanel"][data-value="${value}"]`
      )!.id,
    })

    await React.act(async () => {
      root.render(<Fixture order={['general', 'billing', 'security']} />)
    })
    const before = {
      general: idsFor('general'),
      billing: idsFor('billing'),
      security: idsFor('security'),
    }

    await React.act(async () => {
      ;(
        container.querySelector(
          '[role="tab"][data-value="billing"]'
        ) as HTMLElement
      ).focus()
    })

    // Insert profile before the selected billing tab.
    await React.act(async () => {
      root.render(
        <Fixture order={['general', 'profile', 'billing', 'security']} />
      )
    })
    expect(
      container
        .querySelector('[role="tab"][data-value="billing"]')
        ?.getAttribute('aria-selected')
    ).toBe('true')
    expect(
      (
        container.querySelector(
          '[role="tabpanel"][data-value="billing"]'
        ) as HTMLElement
      )?.hidden
    ).toBe(false)
    expect(idsFor('general')).toEqual(before.general)
    expect(idsFor('billing')).toEqual(before.billing)
    expect(idsFor('security')).toEqual(before.security)
    expect(document.activeElement?.getAttribute('data-value')).toBe('billing')
    expectLinked(before.billing.tab, before.billing.panel)
    expect(log).toEqual([])

    // Reorder billing after security: still selected, still stable, silent.
    await React.act(async () => {
      root.render(
        <Fixture order={['general', 'profile', 'security', 'billing']} />
      )
    })
    expect(
      container
        .querySelector('[role="tab"][data-value="billing"]')
        ?.getAttribute('aria-selected')
    ).toBe('true')
    expect(idsFor('billing')).toEqual(before.billing)
    expect(document.activeElement?.getAttribute('data-value')).toBe('billing')
    expectLinked(before.billing.tab, before.billing.panel)
    expect(log).toEqual([])
  })

  it('TB-DYNAMIC-02: removing the controlled value selects no fallback and requests nothing', async () => {
    // Behavioral half only: the dev-diagnostic half of TB-DYNAMIC-02 was
    // DECLINED (DECISIONS candidate #10) — silent-tolerant, no warn.
    const log: string[] = []
    function Fixture({ values }: { values: string[] }) {
      const [value, setValue] = React.useState('billing')
      return (
        <Tabs
          value={value}
          onChange={(next: string) => {
            log.push(next)
            setValue(next)
          }}
        >
          <Tabs.List>
            {values.map(v => (
              <Tabs.Tab key={v} value={v}>
                {v}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {values.map(v => (
            <Tabs.Panel key={v} value={v}>
              {v} content
            </Tabs.Panel>
          ))}
        </Tabs>
      )
    }

    await React.act(async () => {
      root.render(<Fixture values={['general', 'billing', 'security']} />)
    })
    expect(
      container
        .querySelector('[role="tab"][data-value="billing"]')
        ?.getAttribute('aria-selected')
    ).toBe('true')

    // Remove both billing parts while the controlled value stays billing.
    await React.act(async () => {
      root.render(<Fixture values={['general', 'security']} />)
    })
    for (const tab of Array.from(container.querySelectorAll('[role="tab"]'))) {
      expect(tab.getAttribute('aria-selected')).toBe('false')
    }
    for (const panel of Array.from(
      container.querySelectorAll('[role="tabpanel"]')
    )) {
      expect((panel as HTMLElement).hidden).toBe(true)
    }
    expect(log).toEqual([])
    // Survivors keep resolving linkage with nothing dangling.
    for (const panel of Array.from(
      container.querySelectorAll('[role="tabpanel"]')
    )) {
      const labelledBy = panel.getAttribute('aria-labelledby')!
      expect(document.getElementById(labelledBy)?.getAttribute('role')).toBe(
        'tab'
      )
    }
  })
})

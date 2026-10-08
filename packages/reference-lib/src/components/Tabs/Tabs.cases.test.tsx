// @vitest-environment happy-dom
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { Tabs } from './Tabs'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

function keydown(el: Element, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

function pointerdown(el: Element) {
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }))
}

function mousedown(el: Element) {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
}

function tabIndexOf(id: string) {
  return document.getElementById(id)?.getAttribute('tabindex')
}

function selectedOf(id: string) {
  return document.getElementById(id)?.getAttribute('aria-selected')
}

function hiddenOf(id: string) {
  return (document.getElementById(id) as HTMLElement | null)?.hidden
}

describe('Tabs finish-line cases (SELECT)', () => {
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

  it('TB-SELECT-01: a primary pointer press and release requests the tab exactly once with focus on it', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<Trio log={log} />)
    })

    const billing = document.getElementById('t-billing')!
    await React.act(async () => {
      pointerdown(billing)
      mousedown(billing)
      // Native mousedown-default focus (happy-dom performs no default
      // actions, so the test performs it): the press-armed request fires
      // from the focus handler, before the completing click.
      ;(billing as HTMLElement).focus()
      click(billing)
    })

    expect(log).toEqual(['billing'])
    expect(document.activeElement?.id).toBe('t-billing')
    expect(selectedOf('t-billing')).toBe('true')
    expect(hiddenOf('p-billing')).toBe(false)
  })

  it('TB-SELECT-02: a rejected pointer request retains controlled selection', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<Trio log={log} accept={false} />)
    })

    await React.act(async () => {
      click(document.getElementById('t-billing')!)
    })

    expect(log).toEqual(['billing'])
    expect(selectedOf('t-general')).toBe('true')
    expect(selectedOf('t-billing')).toBe('false')
    expect(hiddenOf('p-general')).toBe(false)
    expect(hiddenOf('p-billing')).toBe(true)
  })

  it('TB-SELECT-05: a consumer click preventDefault cancels pointer selection', async () => {
    const log: string[] = []
    const calls: string[] = []
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
            <Tabs.Tab
              id="t-billing"
              value="billing"
              onClick={e => {
                calls.push('consumer')
                e.preventDefault()
              }}
            >
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
      click(document.getElementById('t-billing')!)
    })

    expect(calls).toEqual(['consumer'])
    expect(log).toEqual([])
    expect(selectedOf('t-general')).toBe('true')
    expect(selectedOf('t-billing')).toBe('false')
  })

  it('TB-SELECT-06: pointer selection blurs panel content before the new tab focus and request', async () => {
    const log: string[] = []
    const order: string[] = []
    function Fixture() {
      const [value, setValue] = React.useState('general')
      return (
        <Tabs
          value={value}
          onChange={(next: string) => {
            order.push(`change:${next}`)
            log.push(next)
            setValue(next)
          }}
        >
          <Tabs.List>
            <Tabs.Tab
              id="t-general"
              value="general"
              onFocus={() => order.push('focus:general')}
            >
              General
            </Tabs.Tab>
            <Tabs.Tab
              id="t-billing"
              value="billing"
              onFocus={() => order.push('focus:billing')}
            >
              Billing
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general">
            <input
              id="panel-input"
              aria-label="Panel input"
              onBlur={() => order.push('blur:input')}
            />
          </Tabs.Panel>
          <Tabs.Panel id="p-billing" value="billing">
            B
          </Tabs.Panel>
        </Tabs>
      )
    }
    await React.act(async () => {
      root.render(<Fixture />)
    })
    await React.act(async () => {
      document.getElementById('panel-input')!.focus()
    })
    order.length = 0

    await React.act(async () => {
      pointerdown(document.getElementById('t-billing')!)
      mousedown(document.getElementById('t-billing')!)
      // Native mousedown-default focus, performed by the test.
      ;(document.getElementById('t-billing') as HTMLElement).focus()
    })

    // Blur fires once, before the new tab focus and the request.
    expect(order).toEqual(['blur:input', 'focus:billing', 'change:billing'])
    expect(log).toEqual(['billing'])
    expect(document.activeElement?.id).toBe('t-billing')
    expect(hiddenOf('p-billing')).toBe(false)
  })

  it('TB-SELECT-08: a primary press requests before the click completes, and the click dedupes', async () => {
    const log: string[] = []
    await React.act(async () => {
      // No accept: the completing click must dedupe against the press,
      // not against a redundant-selection suppression.
      root.render(<Trio log={log} accept={false} activation="manual" />)
    })

    const billing = document.getElementById('t-billing')!
    await React.act(async () => {
      pointerdown(billing)
      mousedown(billing)
      // Native mousedown-default focus, performed by the test: the
      // press-armed request fires here, before pointerup/click.
      ;(billing as HTMLElement).focus()
    })
    // Requested before pointerup/click; press pair dedupes to one.
    expect(log).toEqual(['billing'])
    expect(document.activeElement?.id).toBe('t-billing')

    await React.act(async () => {
      click(billing)
    })
    expect(log).toEqual(['billing'])
  })
})

describe('Tabs finish-line cases (AUTO)', () => {
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

  it('TB-AUTO-01: horizontal arrows move focus, stop, selection, and panel together', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<Trio log={log} initial="billing" />)
    })

    await React.act(async () => {
      document.getElementById('t-billing')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-security')
    expect(tabIndexOf('t-security')).toBe('0')
    expect(tabIndexOf('t-billing')).toBe('-1')
    expect(selectedOf('t-security')).toBe('true')
    expect(hiddenOf('p-security')).toBe(false)
    expect(hiddenOf('p-billing')).toBe(true)
    expect(log).toEqual(['security'])

    await React.act(async () => {
      keydown(document.activeElement!, 'ArrowLeft')
    })
    expect(document.activeElement?.id).toBe('t-billing')
    expect(tabIndexOf('t-billing')).toBe('0')
    expect(selectedOf('t-billing')).toBe('true')
    expect(log).toEqual(['security', 'billing'])
  })

  it('TB-AUTO-03: vertical tabs use only vertical arrows in LTR and RTL', async () => {
    const log: string[] = []
    function Vertical({ dir }: { dir: 'ltr' | 'rtl' }) {
      const [value, setValue] = React.useState('billing')
      return (
        // Inline direction mirrors dir: happy-dom gap, see TB-AUTO-02 note.
        <div dir={dir} style={{ direction: dir }}>
          <Tabs
            value={value}
            orientation="vertical"
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
      root.render(<Vertical dir="ltr" />)
    })

    await React.act(async () => {
      document.getElementById('t-billing')!.focus()
      keydown(document.activeElement!, 'ArrowDown')
    })
    expect(document.activeElement?.id).toBe('t-security')
    expect(log).toEqual(['security'])

    await React.act(async () => {
      keydown(document.activeElement!, 'ArrowUp')
    })
    expect(document.activeElement?.id).toBe('t-billing')
    expect(log).toEqual(['security', 'billing'])

    // Horizontal arrows are unhandled in LTR.
    await React.act(async () => {
      keydown(document.activeElement!, 'ArrowLeft')
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-billing')
    expect(tabIndexOf('t-billing')).toBe('0')
    expect(selectedOf('t-billing')).toBe('true')
    expect(log).toEqual(['security', 'billing'])

    // And unhandled in RTL too (no legacy vertical-RTL horizontal map).
    await React.act(async () => {
      root.render(<Vertical dir="rtl" />)
    })
    log.length = 0
    await React.act(async () => {
      document.getElementById('t-billing')!.focus()
      keydown(document.activeElement!, 'ArrowLeft')
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-billing')
    expect(log).toEqual([])
  })

  it('TB-AUTO-04: automatic navigation wraps, skips disabled, and honors Home/End', async () => {
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
    await React.act(async () => {
      document.getElementById('t-general')!.focus()
    })

    // Skips disabled billing.
    await React.act(async () => {
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-security')

    // Wraps to general.
    await React.act(async () => {
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-general')

    // Home stays on general (no value change, no callback).
    await React.act(async () => {
      keydown(document.activeElement!, 'Home')
    })
    expect(document.activeElement?.id).toBe('t-general')

    // End lands on security.
    await React.act(async () => {
      keydown(document.activeElement!, 'End')
    })
    expect(document.activeElement?.id).toBe('t-security')

    // Exactly one callback per actual value change.
    expect(log).toEqual(['security', 'general', 'security'])
  })

  it('TB-AUTO-05: rejected automatic navigation keeps selection while focus roves', async () => {
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

    await React.act(async () => {
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-security')
    expect(tabIndexOf('t-security')).toBe('0')

    // At most one request per movement; selection and panel stay.
    expect(log).toEqual(['billing', 'security'])
    expect(selectedOf('t-general')).toBe('true')
    expect(hiddenOf('p-general')).toBe(false)
    expect(hiddenOf('p-security')).toBe(true)
  })
})

describe('Tabs finish-line cases (MANUAL funnel + EVENT)', () => {
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

  function ManualTrio({ log }: { log: string[] }) {
    const [value, setValue] = React.useState('general')
    return (
      <Tabs
        value={value}
        activation="manual"
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
        </Tabs.List>
        <Tabs.Panel id="p-general" value="general">
          G
        </Tabs.Panel>
        <Tabs.Panel id="p-billing" value="billing">
          B
        </Tabs.Panel>
      </Tabs>
    )
  }

  it('TB-MANUAL-02: Space requests the focused manual tab on release, never on hold', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<ManualTrio log={log} />)
    })

    await React.act(async () => {
      document.getElementById('t-general')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(document.activeElement?.id).toBe('t-billing')
    expect(log).toEqual([])

    // Hold: keydown alone (no native activation in happy-dom) requests
    // nothing; release-click requests exactly once. Native hold/release
    // timing is pinned in CT on a real engine.
    await React.act(async () => {
      keydown(document.activeElement!, ' ')
    })
    expect(log).toEqual([])
    await React.act(async () => {
      click(document.activeElement!)
    })
    expect(log).toEqual(['billing'])
    expect(document.activeElement?.id).toBe('t-billing')
    expect(selectedOf('t-billing')).toBe('true')
    expect(hiddenOf('p-billing')).toBe(false)
  })

  it('TB-MANUAL-03: Enter requests the focused manual tab without keyup duplicates', async () => {
    const log: string[] = []
    await React.act(async () => {
      root.render(<ManualTrio log={log} />)
    })

    await React.act(async () => {
      document.getElementById('t-general')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(log).toEqual([])

    // Native Enter keydown-click timing is pinned in CT; here the funnel.
    await React.act(async () => {
      keydown(document.activeElement!, 'Enter')
    })
    expect(log).toEqual([])
    await React.act(async () => {
      click(document.activeElement!)
    })
    expect(log).toEqual(['billing'])
    expect(selectedOf('t-billing')).toBe('true')
  })

  it('TB-MANUAL-05: a consumer keydown preventDefault cancels manual movement', async () => {
    const log: string[] = []
    const calls: string[] = []
    function Fixture() {
      const [value, setValue] = React.useState('general')
      return (
        <Tabs
          value={value}
          activation="manual"
          onChange={(next: string) => {
            log.push(next)
            setValue(next)
          }}
        >
          <Tabs.List>
            <Tabs.Tab id="t-general" value="general">
              General
            </Tabs.Tab>
            <Tabs.Tab
              id="t-billing"
              value="billing"
              onKeyDown={e => {
                calls.push('consumer')
                e.preventDefault()
              }}
            >
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
      document.getElementById('t-billing')!.focus()
      keydown(document.activeElement!, 'ArrowRight')
    })
    expect(calls).toEqual(['consumer'])
    expect(document.activeElement?.id).toBe('t-billing')
    expect(tabIndexOf('t-billing')).toBe('0')
    expect(log).toEqual([])
    expect(selectedOf('t-general')).toBe('true')
  })

  it('TB-EVENT-01: activation keys in a nested editable do not select the tab', async () => {
    const log: string[] = []
    function Fixture() {
      const [value, setValue] = React.useState('general')
      return (
        <Tabs
          value={value}
          activation="manual"
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
              <input id="nested-input" defaultValue="draft" aria-label="Nested" />
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

    const input = document.getElementById('nested-input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      // Full press sequences (a real click press-fires first).
      pointerdown(input)
      mousedown(input)
      // Space: keydown plus the native keyup-click it produces.
      keydown(input, ' ')
      click(input)
      // Enter: keydown plus its keydown-click.
      keydown(input, 'Enter')
      click(input)
    })

    expect(input.value).toBe('draft')
    expect(document.activeElement?.id).toBe('nested-input')
    expect(log).toEqual([])
    expect(selectedOf('t-general')).toBe('true')
    expect(selectedOf('t-billing')).toBe('false')

    // Retargeted activation: Chrome delivers Space/Enter activation from
    // the nested editable as a detail-0 click on the tab itself while
    // focus stays nested — ignored, without breaking unfocused clicks.
    await React.act(async () => {
      click(document.getElementById('t-billing')!)
    })
    expect(log).toEqual([])
  })

  it('TB-EVENT-02: activation keys in a portalled editable do not select the tab', async () => {
    const log: string[] = []
    function Fixture() {
      const [value, setValue] = React.useState('general')
      return (
        <Tabs
          value={value}
          activation="manual"
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
              {ReactDOM.createPortal(
                <input id="portalled-input" defaultValue="draft" aria-label="Portalled" />,
                document.body
              )}
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

    const input = document.getElementById('portalled-input') as HTMLInputElement
    // Portalled in the DOM: outside the tab subtree; React-tree child.
    expect(input.closest('[role="tab"]')).toBeNull()
    await React.act(async () => {
      input.focus()
      pointerdown(input)
      mousedown(input)
      keydown(input, ' ')
      click(input)
      keydown(input, 'Enter')
      click(input)
    })

    expect(input.value).toBe('draft')
    expect(log).toEqual([])
    expect(selectedOf('t-general')).toBe('true')
    expect(selectedOf('t-billing')).toBe('false')
  })
})

describe('Tabs finish-line cases (DOM-09 refs + DOM-13 diagnostics)', () => {
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

  it('TB-DOM-09: native customization, refs, and managed state coexist on every part', async () => {
    const seen: Record<string, Element | null> = {}
    // Two passes so every part proves both object and callback refs.
    const passes: Array<{ list: 'object' | 'callback'; tab: 'object' | 'callback'; panel: 'object' | 'callback' }> = [
      { list: 'object', tab: 'object', panel: 'callback' },
      { list: 'callback', tab: 'callback', panel: 'object' },
    ]
    for (const kinds of passes) {
      const listObj = React.createRef<HTMLDivElement>()
      const tabObj = React.createRef<HTMLButtonElement>()
      const panelObj = React.createRef<HTMLDivElement>()
      const listCbCalls: Array<HTMLDivElement | null> = []
      const tabCbCalls: Array<HTMLButtonElement | null> = []
      const panelCbCalls: Array<HTMLDivElement | null> = []
      function Fixture() {
        const [value, setValue] = React.useState('general')
        // Stable callbacks: a fresh closure per render would detach and
        // reattach the ref on every commit.
        const listCb = React.useCallback((node: HTMLDivElement | null) => {
          listCbCalls.push(node)
        }, [])
        const tabCb = React.useCallback((node: HTMLButtonElement | null) => {
          tabCbCalls.push(node)
        }, [])
        const panelCb = React.useCallback((node: HTMLDivElement | null) => {
          panelCbCalls.push(node)
        }, [])
        return (
          <Tabs value={value} onChange={setValue}>
            <Tabs.List
              id="t-list"
              ref={kinds.list === 'object' ? listObj : listCb}
              data-owner="list-owner"
              aria-label="Settings tabs"
              className="custom-list"
              style={{ color: 'rgb(1, 2, 3)' }}
              data-orientation="bogus"
              aria-orientation="vertical"
              onClick={e => {
                seen.list = e.currentTarget
              }}
            >
              <Tabs.Tab
                id="t-general"
                value="general"
                ref={kinds.tab === 'object' ? tabObj : tabCb}
                data-owner="tab-owner"
                aria-label="General tab"
                className="custom-tab"
                style={{ color: 'rgb(4, 5, 6)' }}
                data-state="bogus"
                aria-selected={false}
                aria-controls="bogus-panel"
                onClick={e => {
                  seen.tab = e.currentTarget
                }}
              >
                General
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel
              id="p-general"
              value="general"
              ref={kinds.panel === 'object' ? panelObj : panelCb}
              data-owner="panel-owner"
              aria-label="General panel"
              className="custom-panel"
              style={{ color: 'rgb(7, 8, 9)' }}
              data-state="bogus"
              onClick={e => {
                seen.panel = e.currentTarget
              }}
            >
              G
            </Tabs.Panel>
          </Tabs>
        )
      }
      await React.act(async () => {
        root.render(<Fixture />)
      })

      const list = document.getElementById('t-list')!
      const tab = document.getElementById('t-general')!
      const panel = document.getElementById('p-general')!

      // Hosts: documented natives, no `as` indirection.
      expect(list.tagName).toBe('DIV')
      expect(list.getAttribute('role')).toBe('tablist')
      expect(tab.tagName).toBe('BUTTON')
      expect(tab.getAttribute('role')).toBe('tab')
      expect(panel.tagName).toBe('DIV')
      expect(panel.getAttribute('role')).toBe('tabpanel')

      // Consumer props reach the host.
      expect(list.getAttribute('data-owner')).toBe('list-owner')
      expect(list.getAttribute('aria-label')).toBe('Settings tabs')
      expect(list.className).toContain('custom-list')
      expect((list as HTMLElement).style.color).toBe('rgb(1, 2, 3)')
      expect(tab.getAttribute('data-owner')).toBe('tab-owner')
      expect(tab.getAttribute('aria-label')).toBe('General tab')
      expect(tab.className).toContain('custom-tab')
      expect((tab as HTMLElement).style.color).toBe('rgb(4, 5, 6)')
      expect(panel.getAttribute('data-owner')).toBe('panel-owner')
      expect(panel.getAttribute('aria-label')).toBe('General panel')
      expect(panel.className).toContain('custom-panel')
      expect((panel as HTMLElement).style.color).toBe('rgb(7, 8, 9)')

      // Internal state stays authoritative over consumer conflicts.
      expect(list.getAttribute('data-orientation')).toBe('horizontal')
      expect(list.getAttribute('aria-orientation')).toBe('horizontal')
      expect(tab.getAttribute('data-state')).toBe('active')
      expect(tab.getAttribute('aria-selected')).toBe('true')
      expect(tab.getAttribute('aria-controls')).toBe('p-general')
      expect(panel.getAttribute('data-state')).toBe('active')

      // Handlers see the host as currentTarget.
      await React.act(async () => {
        click(list)
        click(tab)
        click(panel)
      })
      expect(seen.list).toBe(list)
      expect(seen.tab).toBe(tab)
      expect(seen.panel).toBe(panel)

      // Refs receive the host. Slot-wrapped parts (List, Tab) may see
      // settled-correct attach churn while mount commits settle (the
      // kernel slot chain recreates per render), so callback pins assert
      // the settled delivery, not the exact sequence.
      const settled = <T,>(calls: Array<T | null>) => {
        expect(calls.length).toBeGreaterThan(0)
        for (const call of calls) {
          expect(call === null || call === calls[0]).toBe(true)
        }
        return calls[calls.length - 1]
      }
      if (kinds.list === 'object') expect(listObj.current).toBe(list)
      else expect(settled(listCbCalls)).toBe(list)
      if (kinds.tab === 'object') expect(tabObj.current).toBe(tab)
      else expect(settled(tabCbCalls)).toBe(tab)
      if (kinds.panel === 'object') expect(panelObj.current).toBe(panel)
      else expect(settled(panelCbCalls)).toBe(panel)

      // Rerender: object refs stay stable; callback pins re-assert the
      // settled delivery (slot-chain identity churns per render — a
      // kernel follow-up, settled-correct here).
      await React.act(async () => {
        root.render(<Fixture />)
      })
      if (kinds.list === 'object') expect(listObj.current).toBe(list)
      else expect(settled(listCbCalls)).toBe(list)
      if (kinds.tab === 'object') expect(tabObj.current).toBe(tab)
      else expect(settled(tabCbCalls)).toBe(tab)
      if (kinds.panel === 'object') expect(panelObj.current).toBe(panel)
      else expect(settled(panelCbCalls)).toBe(panel)

      // Unmount: object refs clear, callback refs get null.
      await React.act(async () => {
        root.unmount()
      })
      if (kinds.list === 'object') expect(listObj.current).toBeNull()
      else expect(listCbCalls[listCbCalls.length - 1]).toBeNull()
      if (kinds.tab === 'object') expect(tabObj.current).toBeNull()
      else expect(tabCbCalls[tabCbCalls.length - 1]).toBeNull()
      if (kinds.panel === 'object') expect(panelObj.current).toBeNull()
      else expect(panelCbCalls[panelCbCalls.length - 1]).toBeNull()

      root = createRoot(container)
    }
  })

  it('TB-DOM-13: incomplete anatomy warns the exact mismatch with no dangling ARIA', async () => {
    const errors: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    const resolveAllLinked = () => {
      for (const el of Array.from(
        container.querySelectorAll('[aria-controls],[aria-labelledby]')
      )) {
        for (const attr of ['aria-controls', 'aria-labelledby']) {
          const tokens = (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean)
          for (const token of tokens) {
            expect(
              document.getElementById(token),
              `${attr}="${token}" must resolve`
            ).not.toBeNull()
          }
        }
      }
    }
    try {
      // 1. No List: panels without a tablist.
      await React.act(async () => {
        root.render(
          <Tabs value="general">
            <Tabs.Panel value="general">G</Tabs.Panel>
          </Tabs>
        )
      })
      expect(errors.some(m => m.includes('no Tabs.List'))).toBe(true)
      expect(document.querySelector('[role="tabpanel"]')?.getAttribute('aria-labelledby')).toBeNull()
      resolveAllLinked()

      // 2. Two Lists: distinct values so identity stays valid.
      errors.length = 0
      await React.act(async () => {
        root.render(
          <Tabs value="a">
            <Tabs.List>
              <Tabs.Tab value="a">A</Tabs.Tab>
            </Tabs.List>
            <Tabs.List>
              <Tabs.Tab value="b">B</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="a">A</Tabs.Panel>
            <Tabs.Panel value="b">B</Tabs.Panel>
          </Tabs>
        )
      })
      expect(errors.some(m => m.includes('2 Tabs.List'))).toBe(true)
      resolveAllLinked()

      // 3. Missing Tab: an orphan security panel.
      errors.length = 0
      await React.act(async () => {
        root.render(
          <Tabs value="general">
            <Tabs.List>
              <Tabs.Tab value="general">General</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general">G</Tabs.Panel>
            <Tabs.Panel value="security">S</Tabs.Panel>
          </Tabs>
        )
      })
      expect(errors.some(m => m.includes('Panel value "security"'))).toBe(true)
      expect(
        container
          .querySelector('[role="tabpanel"][data-value="security"]')
          ?.getAttribute('aria-labelledby')
      ).toBeNull()
      resolveAllLinked()

      // 4. Missing Panel: the selected tab has no counterpart.
      errors.length = 0
      await React.act(async () => {
        root.render(
          <Tabs value="billing">
            <Tabs.List>
              <Tabs.Tab id="t-general" value="general">
                General
              </Tabs.Tab>
              <Tabs.Tab id="t-billing" value="billing">
                Billing
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="general">G</Tabs.Panel>
          </Tabs>
        )
      })
      expect(errors.some(m => m.includes('Tab value "billing"'))).toBe(true)
      expect(document.getElementById('t-billing')?.getAttribute('aria-controls')).toBeNull()
      resolveAllLinked()

      // 5. Orphan part: a lone tab with no panels at all.
      errors.length = 0
      await React.act(async () => {
        root.render(
          <Tabs value="security">
            <Tabs.List>
              <Tabs.Tab id="t-security" value="security">
                Security
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        )
      })
      expect(errors.some(m => m.includes('Tab value "security"'))).toBe(true)
      expect(document.getElementById('t-security')?.getAttribute('aria-controls')).toBeNull()
      resolveAllLinked()
    } finally {
      spy.mockRestore()
    }
  })
})

// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Popover, type PopoverTriggerProps } from '../Popover'
import { Menu, useMenuTriggerKeys } from './Menu'

// Popover.Trigger with Menu keyboard-entry wiring.
const EntryTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(function EntryTrigger(
  { children, onKeyDown, onClick, 'aria-haspopup': ariaHasPopup = 'menu', ...props }: PopoverTriggerProps,
  ref
) {
  const keys = useMenuTriggerKeys()
  const triggerProps = { ...props, ref: ref as React.Ref<HTMLButtonElement> }
  return (
    <Popover.Trigger
      onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e)
        keys.onKeyDown(e)
      }}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        keys.onClick(e)
      }}
      {...triggerProps}
      aria-haspopup={ariaHasPopup}
    >
      {children}
    </Popover.Trigger>
  )
})

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Menu component keyboard navigation and triggers', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'menu-root'
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
    for (const child of Array.from(document.body.children)) {
      if (child.id !== 'menu-root') {
        child.remove()
      }
    }
  })

  it('renders Popover.Trigger with variant attribute and default variant', async () => {
    await React.act(async () => {
      root.render(
        <Popover>
          <EntryTrigger id="trigger-btn" variant="primary">
            Trigger
          </EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.Item>Item 1</Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const trigger = document.getElementById('trigger-btn')
    expect(trigger).not.toBeNull()
    expect(trigger?.getAttribute('data-variant')).toBe('primary')
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens menu and sets focus on ArrowDown keydown on trigger', async () => {
    await React.act(async () => {
      root.render(
        <Popover>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.Item id="item-1">Item 1</Menu.Item>
              <Menu.Item id="item-2">Item 2</Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const trigger = document.getElementById('trigger-btn')!
    trigger.focus()

    await React.act(async () => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('closes menu and restores focus to trigger on Escape keydown in content', async () => {
    await React.act(async () => {
      root.render(
        <Popover defaultOpen>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu id="menu-content">
              <Menu.Item id="item-1">Item 1</Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const trigger = document.getElementById('trigger-btn')!
    const item1 = document.getElementById('item-1')!

    await React.act(async () => {
      item1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  it('closes menu and restores focus to trigger when item is clicked', async () => {
    let clicked = false
    await React.act(async () => {
      root.render(
        <Popover defaultOpen>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.Item id="item-1" onClick={() => { clicked = true }}>
                Item 1
              </Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const trigger = document.getElementById('trigger-btn')!
    const item1 = document.getElementById('item-1')!

    await React.act(async () => {
      item1.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(clicked).toBe(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  it('MN-ENV-01: Menu should hydrate closed compositions and open them with stable generated relationships', async () => {
    const errors: string[] = []
    const origError = console.error
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    }
    try {
      const html = renderToString(
        <Popover>
          <EntryTrigger id="ssr-trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.Item id="ssr-item-1">Item 1</Menu.Item>
              <Menu.Item id="ssr-item-2">Item 2</Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )

      expect(html).toContain('ssr-trigger-btn')
      expect(html).toContain('aria-haspopup="menu"')
      expect(html).not.toContain('ssr-item-1')

      const host = document.createElement('div')
      host.innerHTML = html
      document.body.appendChild(host)

      const root = hydrateRoot(
        host,
        <Popover>
          <EntryTrigger id="ssr-trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.Item id="ssr-item-1">Item 1</Menu.Item>
              <Menu.Item id="ssr-item-2">Item 2</Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )
      await React.act(async () => {})

      const trigger = document.getElementById('ssr-trigger-btn')!
      await React.act(async () => {
        trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })

      expect(document.getElementById('ssr-item-1')).not.toBeNull()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      const controls = trigger.getAttribute('aria-controls')
      expect(controls).toBeTruthy()
      // The trigger controls the Popover layer, which owns the Menu.
      const controlled = document.getElementById(controls!)
      expect(controlled).not.toBeNull()
      expect(controlled!.querySelector('[role="menu"]')).not.toBeNull()

      await React.act(async () => {
        root.unmount()
      })
      host.remove()
      expect(errors.join('\n')).not.toMatch(/hydrat/i)
    } finally {
      console.error = origError
    }
  })

  it('MN-ENV-02: Menu should keep one action and close request across StrictMode effect replay', async () => {
    const selectSpy = vi.fn()
    const openChangeSpy = vi.fn()

    await React.act(async () => {
      root.render(
        <React.StrictMode>
          <Popover onOpenChange={openChangeSpy}>
            <EntryTrigger id="strict-trigger-btn">Trigger</EntryTrigger>
            <Popover.Content>
              <Menu>
                <Menu.Item id="strict-item-1" onSelect={selectSpy}>
                  Strict Item 1
                </Menu.Item>
              </Menu>
            </Popover.Content>
          </Popover>
        </React.StrictMode>
      )
    })

    const trigger = document.getElementById('strict-trigger-btn')!
    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const item1 = document.getElementById('strict-item-1')!
    await React.act(async () => {
      item1.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(selectSpy).toHaveBeenCalledTimes(1)
    expect(openChangeSpy).toHaveBeenCalledTimes(2)
    expect(openChangeSpy).toHaveBeenNthCalledWith(1, true)
    expect(openChangeSpy).toHaveBeenNthCalledWith(2, false)
  })

  it('MN-DOM-01-nested: nested Menu renders no node with trigger/content roles and controlled expansion', async () => {
    await React.act(async () => {
      root.render(
        <Popover defaultOpen>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu id="menu-root">
              <Menu.Item id="item-new">New</Menu.Item>
              <Menu open onOpen={() => {}} onDismiss={() => {}}>
                <Menu.Trigger id="sub-trigger">Share</Menu.Trigger>
                <Menu.Content id="sub-content">
                  <Menu.Item id="sub-item-email">Email</Menu.Item>
                </Menu.Content>
              </Menu>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const trigger = document.getElementById('sub-trigger')!
    const content = document.getElementById('sub-content')!
    expect(trigger.tagName).toBe('DIV')
    expect(trigger.getAttribute('role')).toBe('menuitem')
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe('sub-content')
    expect(content.tagName).toBe('DIV')
    expect(content.getAttribute('role')).toBe('menu')

    // Nested Menu contributes no node: trigger shares the parent roving container.
    const itemNew = document.getElementById('item-new')!
    expect(trigger.parentElement).toBe(itemNew.parentElement)
  })

  it('MN-SUBKEY-09: omitted nested open stays controlled false and requests open once', async () => {
    const onOpen = vi.fn()
    await React.act(async () => {
      root.render(
        <Popover defaultOpen>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu onOpen={onOpen} onDismiss={() => {}}>
                <Menu.Trigger id="sub-trigger">Share</Menu.Trigger>
                <Menu.Content id="sub-content">
                  <Menu.Item>Never mounted</Menu.Item>
                </Menu.Content>
              </Menu>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const trigger = document.getElementById('sub-trigger')!
    trigger.focus()
    await React.act(async () => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    expect(document.getElementById('sub-content')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('MN-ACT-04: deep selection dismisses deepest-first then the root', async () => {
    const order: string[] = []
    function Harness() {
      const [rootOpen, setRootOpen] = React.useState(true)
      const [l1Open, setL1Open] = React.useState(true)
      const [l2Open, setL2Open] = React.useState(true)
      return (
        <Popover open={rootOpen} onOpenChange={setRootOpen} onDismiss={() => order.push('root')}>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu
                open={l1Open}
                onOpen={() => setL1Open(true)}
                onDismiss={() => {
                  order.push('l1')
                  setL1Open(false)
                }}
              >
                <Menu.Trigger>Share</Menu.Trigger>
                <Menu.Content>
                  <Menu
                    open={l2Open}
                    onOpen={() => setL2Open(true)}
                    onDismiss={() => {
                      order.push('l2')
                      setL2Open(false)
                    }}
                  >
                    <Menu.Trigger>More</Menu.Trigger>
                    <Menu.Content>
                      <Menu.Item id="deep-item" onSelect={() => order.push('select')}>
                        Deep
                      </Menu.Item>
                    </Menu.Content>
                  </Menu>
                </Menu.Content>
              </Menu>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    }
    await React.act(async () => {
      root.render(<Harness />)
    })

    const deep = document.getElementById('deep-item')!
    await React.act(async () => {
      deep.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(order).toEqual(['select', 'l2', 'l1', 'root'])
    expect(document.getElementById('trigger-btn')?.getAttribute('aria-expanded')).toBe('false')
  })

  it('MN-LINK-01: LinkItem renders a native anchor with menuitem semantics', async () => {
    await React.act(async () => {
      root.render(
        <Popover defaultOpen>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.LinkItem
                id="link-help"
                href="/help"
                target="_blank"
                download="report.csv"
                rel="noreferrer"
              >
                Help
              </Menu.LinkItem>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const link = document.getElementById('link-help')!
    expect(link).toBeInstanceOf(HTMLAnchorElement)
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('role')).toBe('menuitem')
    expect(link.getAttribute('href')).toBe('/help')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('download')).toBe('report.csv')
    expect(link.getAttribute('rel')).toBe('noreferrer')
  })

  it('MN-LINK-02: unmodified LinkItem click selects once and dismisses without preventing navigation', async () => {
    const onSelect = vi.fn()
    const rootChanges: boolean[] = []
    await React.act(async () => {
      root.render(
        <Popover defaultOpen onOpenChange={next => rootChanges.push(next)}>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.LinkItem id="link-help" href="/help" onSelect={onSelect}>
                Help
              </Menu.LinkItem>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const link = document.getElementById('link-help')!
    let defaultPrevented: boolean | null = null
    link.addEventListener('click', e => {
      defaultPrevented = e.defaultPrevented
    })
    await React.act(async () => {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(defaultPrevented).toBe(false)
    expect(rootChanges).toEqual([false])
  })

  it('MN-LINK-04: prevented LinkItem click cancels both navigation and dismissal', async () => {
    const rootChanges: boolean[] = []
    await React.act(async () => {
      root.render(
        <Popover defaultOpen onOpenChange={next => rootChanges.push(next)}>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.LinkItem
                id="link-help"
                href="/help"
                onSelect={e => e.preventDefault()}
              >
                Help
              </Menu.LinkItem>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const link = document.getElementById('link-help')!
    await React.act(async () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })
    expect(rootChanges).toEqual([])
    expect(document.getElementById('link-help')).not.toBeNull()
  })

  it('MN-LINK-05: modified LinkItem click stays native without selecting or dismissing', async () => {
    const onSelect = vi.fn()
    const rootChanges: boolean[] = []
    await React.act(async () => {
      root.render(
        <Popover defaultOpen onOpenChange={next => rootChanges.push(next)}>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.LinkItem id="link-help" href="/help" onSelect={onSelect}>
                Help
              </Menu.LinkItem>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const link = document.getElementById('link-help')!
    await React.act(async () => {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }))
    })

    expect(onSelect).not.toHaveBeenCalled()
    expect(rootChanges).toEqual([])
    expect(document.getElementById('link-help')).not.toBeNull()
  })

  it('MN-LINK-07: disabled LinkItem is non-navigable and inert', async () => {
    const onSelect = vi.fn()
    const rootChanges: boolean[] = []
    await React.act(async () => {
      root.render(
        <Popover defaultOpen onOpenChange={next => rootChanges.push(next)}>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.LinkItem id="link-help" href="/help" disabled onSelect={onSelect}>
                Help
              </Menu.LinkItem>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const link = document.getElementById('link-help')!
    expect(link.getAttribute('aria-disabled')).toBe('true')
    await React.act(async () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
    })
    expect(onSelect).not.toHaveBeenCalled()
    expect(rootChanges).toEqual([])
  })

  it('MN-LINK-03: LinkItem Space funnels through one synthetic click', async () => {
    const onSelect = vi.fn()
    const clicks: number[] = []
    await React.act(async () => {
      root.render(
        <Popover defaultOpen>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.LinkItem
                id="link-help"
                href="/help"
                onSelect={onSelect}
                onClick={() => clicks.push(1)}
              >
                Help
              </Menu.LinkItem>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const link = document.getElementById('link-help')!
    link.focus()
    await React.act(async () => {
      link.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))
    })

    expect(clicks).toHaveLength(1)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('MN-LINK-08: LinkItem closeOnSelect=false preserves activation without dismissal', async () => {
    const onSelect = vi.fn()
    const rootChanges: boolean[] = []
    await React.act(async () => {
      root.render(
        <Popover defaultOpen onOpenChange={next => rootChanges.push(next)}>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.LinkItem id="link-help" href="/help" closeOnSelect={false} onSelect={onSelect}>
                Help
              </Menu.LinkItem>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const link = document.getElementById('link-help')!
    await React.act(async () => {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(rootChanges).toEqual([])
    expect(document.getElementById('link-help')).not.toBeNull()
  })

  it('does not focus menu items when opened via mouse click', async () => {
    await React.act(async () => {
      root.render(
        <Popover>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.Item id="item-1">Item 1</Menu.Item>
              <Menu.Item id="item-2">Item 2</Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const trigger = document.getElementById('trigger-btn')!
    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const item1 = document.getElementById('item-1')!
    expect(document.activeElement).not.toBe(item1)
  })

  it('MN-DOM-B27: Menu.md Popover+root-Menu+direct-Item composition opens without crashing', async () => {
    await React.act(async () => {
      root.render(
        <Popover>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.Item id="item-1">Item 1</Menu.Item>
              <Menu.Item id="item-2">Item 2</Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    const trigger = document.getElementById('trigger-btn')!
    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // No RovingFocus.Root throw: the menu owns its roving set.
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById('item-1')?.getAttribute('role')).toBe('menuitem')
    expect(document.getElementById('item-2')?.getAttribute('role')).toBe('menuitem')
  })

  it('MN-CHOICE-03: CheckboxItem keeps controlled checked authoritative across rejection and updates', async () => {
    const onChange = vi.fn()
    const renderChecked = async (checked: boolean | 'mixed') => {
      await React.act(async () => {
        root.render(
          <Popover defaultOpen>
            <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
            <Popover.Content>
              <Menu>
                <Menu.CheckboxItem id="choice-grid" checked={checked} onChange={onChange}>
                  Show grid
                </Menu.CheckboxItem>
              </Menu>
            </Popover.Content>
          </Popover>
        )
      })
    }

    await renderChecked(false)
    const item = document.getElementById('choice-grid')!
    expect(item.getAttribute('role')).toBe('menuitemcheckbox')
    expect(item.getAttribute('aria-checked')).toBe('false')
    expect(item.getAttribute('data-state')).toBe('unchecked')

    // Rejected request: parent ignores onChange, ARIA never moves.
    await React.act(async () => {
      item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(true)
    expect(item.getAttribute('aria-checked')).toBe('false')

    // Programmatic updates change ARIA without callbacks.
    await renderChecked(true)
    expect(document.getElementById('choice-grid')?.getAttribute('aria-checked')).toBe('true')
    expect(document.getElementById('choice-grid')?.getAttribute('data-state')).toBe('checked')
    expect(onChange).toHaveBeenCalledTimes(1)

    await renderChecked('mixed')
    expect(document.getElementById('choice-grid')?.getAttribute('aria-checked')).toBe('mixed')
    expect(document.getElementById('choice-grid')?.getAttribute('data-state')).toBe('mixed')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('MN-CHOICE-05: RadioGroup preserves controlled value through rejection, reorder, and absent values', async () => {
    const onChange = vi.fn()
    const renderGroup = async (value: string | null, order: string[]) => {
      await React.act(async () => {
        root.render(
          <Popover defaultOpen>
            <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
            <Popover.Content>
              <Menu>
                <Menu.RadioGroup aria-label="Sort by" value={value} onChange={onChange}>
                  {order.map(v => (
                    <Menu.RadioItem key={v} id={`sort-${v}`} value={v}>
                      {v}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu>
            </Popover.Content>
          </Popover>
        )
      })
    }

    await renderGroup('name', ['name', 'date'])
    expect(document.getElementById('sort-name')?.getAttribute('aria-checked')).toBe('true')
    expect(document.getElementById('sort-date')?.getAttribute('aria-checked')).toBe('false')

    // Rejected request keeps name checked.
    await React.act(async () => {
      document.getElementById('sort-date')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('date')
    expect(document.getElementById('sort-name')?.getAttribute('aria-checked')).toBe('true')

    // Reorder follows value identity without callbacks.
    await renderGroup('name', ['date', 'name'])
    const radios = Array.from(document.querySelectorAll('[role="menuitemradio"]'))
    expect(radios.map(el => el.id)).toEqual(['sort-date', 'sort-name'])
    expect(document.getElementById('sort-name')?.getAttribute('aria-checked')).toBe('true')
    expect(onChange).toHaveBeenCalledTimes(1)

    // Absent value leaves every mounted radio unchecked.
    await renderGroup('ghost', ['date', 'name'])
    expect(document.getElementById('sort-name')?.getAttribute('aria-checked')).toBe('false')
    expect(document.getElementById('sort-date')?.getAttribute('aria-checked')).toBe('false')
    expect(onChange).toHaveBeenCalledTimes(1)

    // Programmatic selection checks without callbacks.
    await renderGroup('date', ['date', 'name'])
    expect(document.getElementById('sort-date')?.getAttribute('aria-checked')).toBe('true')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('MN-CHOICE-06: choice activation orders native, select, state request, then dismissal', async () => {
    const order: string[] = []
    await React.act(async () => {
      root.render(
        <Popover defaultOpen onOpenChange={next => next === false && order.push('dismiss')}>
          <EntryTrigger id="trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.CheckboxItem
                id="choice-grid"
                checked={false}
                closeOnSelect
                onClick={() => order.push('native')}
                onSelect={() => order.push('select')}
                onChange={next => order.push(`change:${next}`)}
              >
                Show grid
              </Menu.CheckboxItem>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    })

    await React.act(async () => {
      document.getElementById('choice-grid')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(order).toEqual(['native', 'select', 'change:true', 'dismiss'])
    expect(document.getElementById('choice-grid')).toBeNull()
  })
})

// Red-team Hunt 1 fortify pin (P4): entry keys on an ALREADY-OPEN trigger
// plant no consumable intent. Each leg plants from the open trigger, closes,
// then reopens: genuine key reopens land per the fresh key, and a
// gesture-free programmatic reopen lands on the container.
describe('Menu plant-site pin', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'menu-root'
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await React.act(async () => {
      root.unmount()
    })
    container.remove()
    for (const child of Array.from(document.body.children)) {
      if (child.id !== 'menu-root') {
        child.remove()
      }
    }
  })

  /** Menu entry focus runs in requestAnimationFrame; flush it inside act. */
  async function flushEntryFocus(rounds = 3) {
    await React.act(async () => {
      for (let i = 0; i < rounds; i++) {
        await new Promise<void>(resolve => {
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => resolve())
          } else {
            setTimeout(() => resolve(), 16)
          }
        })
      }
    })
  }

  function pressKey(el: HTMLElement, key: string) {
    return React.act(async () => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    })
  }

  it('P4: Up/Down on an already-open trigger plants no consumable intent', async () => {
    const control = { setOpen: (_v: boolean) => {} }
    function Harness() {
      const [open, setOpen] = React.useState(false)
      control.setOpen = setOpen
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <EntryTrigger id="pin-trigger-btn">Trigger</EntryTrigger>
          <Popover.Content>
            <Menu>
              <Menu.Item id="pin-item-1">Item 1</Menu.Item>
              <Menu.Item id="pin-item-2">Item 2</Menu.Item>
            </Menu>
          </Popover.Content>
        </Popover>
      )
    }
    await React.act(async () => {
      root.render(<Harness />)
    })
    const trigger = () => document.getElementById('pin-trigger-btn')!
    const isContainerFocused = () =>
      (document.activeElement as HTMLElement | null)?.hasAttribute('data-reference-menu-content') ??
      false

    // Seed: pointer open lands on the container; Up on the open trigger is a
    // non-opening key (stays open, plants nothing fix-side).
    await React.act(async () => {
      trigger().dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await flushEntryFocus()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    trigger().focus()
    await pressKey(trigger(), 'ArrowUp')
    await React.act(async () => {
      control.setOpen(false)
    })
    expect(document.getElementById('pin-item-1')).toBeNull()

    // Genuine Down reopen lands on the first item.
    await pressKey(trigger(), 'ArrowDown')
    await flushEntryFocus()
    expect(document.activeElement?.id).toBe('pin-item-1')

    // Up on the open trigger, then a genuine Up reopen lands on the last item.
    trigger().focus()
    await pressKey(trigger(), 'ArrowUp')
    await React.act(async () => {
      control.setOpen(false)
    })
    await pressKey(trigger(), 'ArrowUp')
    await flushEntryFocus()
    expect(document.activeElement?.id).toBe('pin-item-2')

    // Up on the open trigger, then a gesture-free programmatic reopen lands
    // on the container — the stale 'last' must not leak into it.
    trigger().focus()
    await pressKey(trigger(), 'ArrowUp')
    await React.act(async () => {
      control.setOpen(false)
    })
    await React.act(async () => {
      control.setOpen(true)
    })
    await flushEntryFocus()
    expect(document.getElementById('pin-item-1')).not.toBeNull()
    expect(
      isContainerFocused(),
      `programmatic reopen landed on #${(document.activeElement as HTMLElement | null)?.id}; expected the menu container`
    ).toBe(true)
  })
})

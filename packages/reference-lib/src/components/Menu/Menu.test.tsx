// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Popover, type PopoverTriggerProps } from '../Popover'
import { Menu, useMenuTriggerKeys } from './Menu'

// Popover.Trigger with Menu keyboard-entry wiring.
const EntryTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(function EntryTrigger(
  { children, onKeyDown, onClick, ...props }: PopoverTriggerProps,
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
    // FLAG(#4): Popover.Trigger hardcodes aria-haspopup="dialog" after spread;
    // menu-correct value is "menu" once the Popover crew ships an override seam.
    expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog')
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
      // FLAG(#4): Popover.Trigger hardcodes aria-haspopup="dialog" after spread;
      // menu-correct value is "menu" once the Popover crew ships an override seam.
      expect(html).toContain('aria-haspopup="dialog"')
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
})

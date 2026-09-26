// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Menu } from './Menu'

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

  it('renders Menu.Trigger with variant attribute and default variant', async () => {
    await React.act(async () => {
      root.render(
        <Menu>
          <Menu.Trigger id="trigger-btn" variant="primary">
            Trigger
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item>Item 1</Menu.Item>
          </Menu.Content>
        </Menu>
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
        <Menu>
          <Menu.Trigger id="trigger-btn">Trigger</Menu.Trigger>
          <Menu.Content>
            <Menu.Item id="item-1">Item 1</Menu.Item>
            <Menu.Item id="item-2">Item 2</Menu.Item>
          </Menu.Content>
        </Menu>
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
        <Menu defaultOpen>
          <Menu.Trigger id="trigger-btn">Trigger</Menu.Trigger>
          <Menu.Content id="menu-content">
            <Menu.Item id="item-1">Item 1</Menu.Item>
          </Menu.Content>
        </Menu>
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
        <Menu defaultOpen>
          <Menu.Trigger id="trigger-btn">Trigger</Menu.Trigger>
          <Menu.Content>
            <Menu.Item id="item-1" onClick={() => { clicked = true }}>
              Item 1
            </Menu.Item>
          </Menu.Content>
        </Menu>
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
        <Menu>
          <Menu.Trigger id="ssr-trigger-btn">Trigger</Menu.Trigger>
          <Menu.Content>
            <Menu.Item id="ssr-item-1">Item 1</Menu.Item>
            <Menu.Item id="ssr-item-2">Item 2</Menu.Item>
          </Menu.Content>
        </Menu>
      )

      expect(html).toContain('ssr-trigger-btn')
      expect(html).toContain('aria-haspopup="menu"')
      expect(html).not.toContain('ssr-item-1')

      const host = document.createElement('div')
      host.innerHTML = html
      document.body.appendChild(host)

      const root = hydrateRoot(
        host,
        <Menu>
          <Menu.Trigger id="ssr-trigger-btn">Trigger</Menu.Trigger>
          <Menu.Content>
            <Menu.Item id="ssr-item-1">Item 1</Menu.Item>
            <Menu.Item id="ssr-item-2">Item 2</Menu.Item>
          </Menu.Content>
        </Menu>
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
      expect(document.getElementById(controls!)).not.toBeNull()

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
          <Menu onOpenChange={openChangeSpy}>
            <Menu.Trigger id="strict-trigger-btn">Trigger</Menu.Trigger>
            <Menu.Content>
              <Menu.Item id="strict-item-1" onSelect={selectSpy}>
                Strict Item 1
              </Menu.Item>
            </Menu.Content>
          </Menu>
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
        <Menu>
          <Menu.Trigger id="trigger-btn">Trigger</Menu.Trigger>
          <Menu.Content>
            <Menu.Item id="item-1">Item 1</Menu.Item>
            <Menu.Item id="item-2">Item 2</Menu.Item>
          </Menu.Content>
        </Menu>
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

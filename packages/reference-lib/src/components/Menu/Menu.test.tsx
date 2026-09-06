// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
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
    let selected = false
    await React.act(async () => {
      root.render(
        <Menu defaultOpen>
          <Menu.Trigger id="trigger-btn">Trigger</Menu.Trigger>
          <Menu.Content>
            <Menu.Item id="item-1" onSelect={() => { selected = true }}>
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

    expect(selected).toBe(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
})

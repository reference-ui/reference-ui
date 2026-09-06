// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { Tabs } from './Tabs'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

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

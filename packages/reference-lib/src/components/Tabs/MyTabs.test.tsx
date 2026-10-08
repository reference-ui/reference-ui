// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { css } from '@reference-ui/react'
import {
  Tabs,
  tabsListRecipe,
  tabsTabRecipe,
  type TabsVariant,
} from './Tabs'
import {
  MyTabsList,
  MyTabsTab,
  myTabsList,
  myTabsTab,
  type MyTabsVariant,
} from './MyTabs'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

describe('Tabs system variants (HQ mechanism)', () => {
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

  it('types: custom names are typed by the author recipe, carried by the open kernel prop', () => {
    // The author's own typed variant, inferred from their recipe.
    const custom: MyTabsVariant = 'underline'
    expect(myTabsTab({ variant: custom, selected: 'selected' })).toContain(
      'myTabsTab_v_underline'
    )
    expect(myTabsList({ variant: custom })).toContain('myTabsList_v_underline')
    // @ts-expect-error - kernel names are unknown to the author recipe
    const _bad: MyTabsVariant = 'pill'
    expect(_bad).toBeDefined()

    // Kernel built-ins stay, and custom names typecheck through the open prop.
    const builtin: TabsVariant = 'pill'
    const el = (
      <Tabs.Tab value="a" variant="underline">
        A
      </Tabs.Tab>
    )
    expect(builtin).toBe('pill')
    expect(el).toBeDefined()

    // Kernel recipe selections are typed per axis.
    const listClasses: string = tabsListRecipe({
      variant: 'line',
      orientation: 'horizontal',
    })
    expect(listClasses).toContain('tabsList_v_line')
    expect(
      tabsTabRecipe({
        variant: 'pill',
        orientation: 'horizontal',
        selected: 'selected',
        disabled: 'enabled',
      })
    ).toContain('tabsTab_v_pill')
    // @ts-expect-error - axis values are literal-checked
    tabsTabRecipe({ variant: 'nope' })
  })

  it('renders the custom variant through author recipe classes + kernel base', async () => {
    function Fixture() {
      const [value, setValue] = React.useState('overview')
      return (
        <Tabs value={value} onChange={setValue}>
          <MyTabsList id="my-list">
            <MyTabsTab
              id="my-overview"
              value="overview"
              selected={value === 'overview'}
            >
              Overview
            </MyTabsTab>
            <MyTabsTab
              id="my-activity"
              value="activity"
              selected={value === 'activity'}
            >
              Activity
            </MyTabsTab>
          </MyTabsList>
          <Tabs.Panel value="overview">O</Tabs.Panel>
          <Tabs.Panel value="activity">A</Tabs.Panel>
        </Tabs>
      )
    }
    await React.act(async () => {
      root.render(<Fixture />)
    })

    const list = document.getElementById('my-list')
    const active = document.getElementById('my-overview')
    const inactive = document.getElementById('my-activity')

    // Author recipe classes paint the flavor...
    expect(list?.className).toContain('myTabsList_v_underline')
    expect(active?.className).toContain('myTabsTab_v_underline')
    expect(active?.className).toContain('myTabsTab_s_selected')
    expect(inactive?.className).toContain('myTabsTab_s_unselected')
    // ...composed over the kernel base + axes, with no built-in paint.
    expect(list?.className).toContain('tabsList__base')
    expect(list?.className).not.toContain('tabsList_v_')
    expect(active?.className).toContain('tabsTab__base')
    expect(active?.className).toContain('tabsTab_s_selected')
    expect(active?.className).not.toContain('tabsTab_v_')
    // The name flows through honestly.
    expect(active?.getAttribute('data-variant')).toBe('underline')
    // Kernel behavior (selection/ARIA) is untouched by the custom flavor.
    expect(active?.getAttribute('aria-selected')).toBe('true')
    expect(inactive?.getAttribute('aria-selected')).toBe('false')
  })

  it('overrides a built-in through css(), composed over the kernel recipe', async () => {
    function Fixture() {
      return (
        <Tabs value="a">
          <Tabs.List>
            <Tabs.Tab
              id="ovr"
              value="a"
              className={css({ color: 'red.500' })}
            >
              A
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">A</Tabs.Panel>
        </Tabs>
      )
    }
    await React.act(async () => {
      root.render(<Fixture />)
    })

    const tab = document.getElementById('ovr')
    expect(tab?.className).toContain('tabsTab_v_line')
    expect(tab?.className).toContain('c_red.500')
  })
})

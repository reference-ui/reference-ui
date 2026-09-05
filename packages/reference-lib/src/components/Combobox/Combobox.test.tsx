// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { createRoot } from 'react-dom/client'
import { Combobox } from './index'
import { Listbox } from '../Listbox'
import { Field } from '../Field'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
]

function TestCombobox({
  initialValue = 'react',
  initialOpen = true,
}: {
  initialValue?: string | null
  initialOpen?: boolean
}) {
  const [val, setVal] = React.useState<string | null>(initialValue)
  return (
    <Combobox value={val} onChange={setVal} defaultOpen={initialOpen}>
      <Field>
        <Combobox.Input placeholder="Search..." />
      </Field>
      <Combobox.Popover>
        <Listbox>
          {frameworks.map(f => (
            <Listbox.Option key={f.value} value={f.value}>
              {f.label}
            </Listbox.Option>
          ))}
        </Listbox>
      </Combobox.Popover>
    </Combobox>
  )
}

describe('Combobox & Listbox React Spectrum theming and active navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('highlights selected item by default when opened and renders checkmark', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await React.act(async () => {
      root.render(<TestCombobox initialValue="react" initialOpen={true} />)
    })

    const reactOption = document.body.querySelector('[data-value="react"]') as HTMLElement
    const vueOption = document.body.querySelector('[data-value="vue"]') as HTMLElement

    expect(reactOption).toBeTruthy()
    expect(reactOption.hasAttribute('data-active')).toBe(true)
    expect(reactOption.getAttribute('data-state')).toBe('selected')
    expect(reactOption.className).toContain('bg_ui.button.background')
    expect(reactOption.className).toContain('c_ui.button.foreground')

    const reactLabel = reactOption.querySelector('span:not([data-slot="check"])') as HTMLElement
    expect(reactLabel).toBeTruthy()
    expect(reactLabel.className).toContain('c_inherit')

    const reactCheck = reactOption.querySelector('[data-slot="check"]') as HTMLElement
    expect(reactCheck).toBeTruthy()
    expect(reactCheck.className).toContain('c_inherit')

    expect(vueOption).toBeTruthy()
    expect(vueOption.hasAttribute('data-active')).toBe(false)
    expect(vueOption.getAttribute('data-state')).toBe('unselected')
    expect(vueOption.className).toContain('c_design.text.base')
    expect(vueOption.querySelector('[data-slot="check"]')).toBeFalsy()

    root.unmount()
    container.remove()
  })

  it('moves highlight with mouse pointer and preserves checkmark on selected item', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await React.act(async () => {
      root.render(<TestCombobox initialValue="react" initialOpen={true} />)
    })

    const reactOption = document.body.querySelector('[data-value="react"]') as HTMLElement
    const vueOption = document.body.querySelector('[data-value="vue"]') as HTMLElement
    const listbox = document.body.querySelector('[role="listbox"]') as HTMLElement

    // Hover over Vue
    await React.act(async () => {
      vueOption.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      vueOption.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })

    // Vue is now active (highlighted)
    expect(vueOption.hasAttribute('data-active')).toBe(true)
    expect(vueOption.querySelector('[data-slot="check"]')).toBeFalsy()

    // React is no longer active, but still selected with checkmark
    expect(reactOption.hasAttribute('data-active')).toBe(false)
    expect(reactOption.getAttribute('data-state')).toBe('selected')
    expect(reactOption.querySelector('[data-slot="check"]')).toBeTruthy()

    // Mouse leaves listbox -> highlight reverts to selected item (React)
    await React.act(async () => {
      listbox.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }))
      listbox.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false, relatedTarget: document.body }))
      listbox.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }))
      listbox.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, relatedTarget: document.body }))
    })

    expect(reactOption.hasAttribute('data-active')).toBe(true)
    expect(vueOption.hasAttribute('data-active')).toBe(false)

    root.unmount()
    container.remove()
  })

  it('navigates highlight via ArrowDown / ArrowUp and commits with Enter', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await React.act(async () => {
      root.render(<TestCombobox initialValue="react" initialOpen={true} />)
    })

    const input = container.querySelector('input[role="combobox"]') as HTMLInputElement
    const reactOption = document.body.querySelector('[data-value="react"]') as HTMLElement
    const vueOption = document.body.querySelector('[data-value="vue"]') as HTMLElement

    // Initial state: React is active
    expect(reactOption.hasAttribute('data-active')).toBe(true)
    expect(input.getAttribute('aria-activedescendant')).toBe(reactOption.id)

    // Press ArrowDown -> Vue becomes active
    await React.act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })

    expect(vueOption.hasAttribute('data-active')).toBe(true)
    expect(reactOption.hasAttribute('data-active')).toBe(false)
    expect(input.getAttribute('aria-activedescendant')).toBe(vueOption.id)

    // Press Enter -> commits Vue
    await React.act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(input.getAttribute('aria-expanded')).toBe('false')

    root.unmount()
    container.remove()
  })

  it('supports Home, End, Tab commit, and skips disabled options', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    function SectionedCombobox() {
      const [val, setVal] = React.useState<string | null>('opt-1')
      return (
        <Combobox value={val} onChange={setVal} defaultOpen={true}>
          <Field>
            <Combobox.Input placeholder="Search..." />
          </Field>
          <Combobox.Popover>
            <Listbox>
              <Listbox.Section title="Section 1">
                <Listbox.Option value="opt-1" textValue="Option 1">
                  Option 1
                </Listbox.Option>
                <Listbox.Option value="opt-disabled" textValue="Disabled" disabled>
                  Disabled
                </Listbox.Option>
                <Listbox.Option value="opt-3" textValue="Option 3">
                  Option 3
                </Listbox.Option>
              </Listbox.Section>
            </Listbox>
          </Combobox.Popover>
        </Combobox>
      )
    }

    await React.act(async () => {
      root.render(<SectionedCombobox />)
    })

    const input = container.querySelector('input[role="combobox"]') as HTMLInputElement
    const opt1 = document.body.querySelector('[data-value="opt-1"]') as HTMLElement
    const optDisabled = document.body.querySelector('[data-value="opt-disabled"]') as HTMLElement
    const opt3 = document.body.querySelector('[data-value="opt-3"]') as HTMLElement

    // Default first option active
    expect(opt1.hasAttribute('data-active')).toBe(true)

    // Press ArrowDown -> skips disabled option and activates opt-3
    await React.act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    expect(opt3.hasAttribute('data-active')).toBe(true)
    expect(optDisabled.hasAttribute('data-active')).toBe(false)

    // Press End -> still opt-3
    await React.act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    })
    expect(opt3.hasAttribute('data-active')).toBe(true)

    // Press Home -> opt-1
    await React.act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    })
    expect(opt1.hasAttribute('data-active')).toBe(true)

    // Press Tab -> commits opt-1
    await React.act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })
    expect(input.getAttribute('aria-expanded')).toBe('false')

    root.unmount()
    container.remove()
  })

  it('renders Listbox.Section header and Listbox.Empty states', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await React.act(async () => {
      root.render(
        <Listbox>
          <Listbox.Section title="Category A">
            <Listbox.Option value="a1">Item A1</Listbox.Option>
          </Listbox.Section>
          <Listbox.Empty>No items found</Listbox.Empty>
        </Listbox>
      )
    })

    const section = container.querySelector('[data-reference-listbox-section]') as HTMLElement
    expect(section).toBeTruthy()
    expect(section.getAttribute('role')).toBe('group')

    const header = container.querySelector('[data-reference-listbox-header]') as HTMLElement
    expect(header).toBeTruthy()
    expect(header.textContent).toBe('Category A')

    const empty = container.querySelector('[data-reference-listbox-empty]') as HTMLElement
    expect(empty).toBeTruthy()
    expect(empty.textContent).toBe('No items found')

    root.unmount()
    container.remove()
  })
})

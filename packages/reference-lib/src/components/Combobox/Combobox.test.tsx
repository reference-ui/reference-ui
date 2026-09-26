// @vitest-environment happy-dom
import * as React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
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

  it('CB-NAV-02/CB-DOM-05: highlights selected item by default when opened and renders checkmark', async () => {
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
    expect(reactCheck.querySelector('.ref-div')?.className).toContain('c_inherit')

    expect(vueOption).toBeTruthy()
    expect(vueOption.hasAttribute('data-active')).toBe(false)
    expect(vueOption.getAttribute('data-state')).toBe('unselected')
    expect(vueOption.className).toContain('c_design.text.base')
    expect(vueOption.querySelector('[data-slot="check"]')).toBeFalsy()

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CB-NAV-05 hover: moves highlight with mouse pointer and preserves checkmark on selected item', async () => {
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

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CB-NAV-01/CB-COMMIT-01/CB-EDIT-01: navigates highlight via ArrowDown / ArrowUp and commits with Enter', async () => {
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

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('CB-EDIT-03/CB-COMMIT-04: leaves Home/End native, commits with Tab, and skips disabled options', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onChange = vi.fn()
    const onInputValueChange = vi.fn()

    function SectionedCombobox() {
      const [val, setVal] = React.useState<string | null>('opt-1')
      return (
        <Combobox
          value={val}
          onChange={v => {
            onChange(v)
            setVal(v)
          }}
          onInputValueChange={onInputValueChange}
          defaultOpen={true}
        >
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

    // Home/End stay native in the editable input: not prevented, active kept, silent
    for (const key of ['Home', 'End']) {
      const callsBefore = onChange.mock.calls.length + onInputValueChange.mock.calls.length
      let prevented: boolean | null = null
      await React.act(async () => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
        input.dispatchEvent(event)
        prevented = event.defaultPrevented
      })
      expect(prevented).toBe(false)
      expect(opt3.hasAttribute('data-active')).toBe(true)
      expect(onChange.mock.calls.length + onInputValueChange.mock.calls.length).toBe(callsBefore)
    }

    // Press Tab -> commits opt-3 and stays native (traversal preserved)
    let tabPrevented: boolean | null = null
    await React.act(async () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      input.dispatchEvent(event)
      tabPrevented = event.defaultPrevented
    })
    expect(tabPrevented).toBe(false)
    expect(onChange).toHaveBeenCalledWith('opt-3')
    expect(input.getAttribute('aria-expanded')).toBe('false')

    await React.act(async () => {
      root.unmount()
    })
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

    await React.act(async () => {
      root.unmount()
    })
    container.remove()
  })
})

interface CaseOption {
  value: string
  label: string
  disabled?: boolean
}

const caseOptions: CaseOption[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'bravo', label: 'Bravo' },
  { value: 'charlie', label: 'Charlie' },
]

async function mount(node: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await React.act(async () => {
    root.render(node)
  })
  return { container, root }
}

async function unmount(container: HTMLElement, root: Root) {
  await React.act(async () => {
    root.unmount()
  })
  container.remove()
}

function inputOf(container: HTMLElement) {
  return container.querySelector('input[role="combobox"]') as HTMLInputElement
}

function triggerOf(container: HTMLElement) {
  return container.querySelector('button[role="combobox"]') as HTMLButtonElement
}

function optionOf(value: string) {
  return document.body.querySelector(`[data-value="${value}"]`) as HTMLElement | null
}

function popoverOf() {
  return document.body.querySelector('[data-reference-combobox-popover]') as HTMLElement | null
}

async function pressKey(el: Element, key: string, init?: KeyboardEventInit) {
  let prevented = false
  await React.act(async () => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
    el.dispatchEvent(event)
    prevented = event.defaultPrevented
  })
  return prevented
}

function typeText(input: HTMLInputElement, text: string) {
  const prototype = window.HTMLInputElement?.prototype as HTMLInputElement | undefined
  const nativeSetter = prototype
    ? Object.getOwnPropertyDescriptor(prototype, 'value')?.set
    : undefined
  if (nativeSetter) {
    nativeSetter.call(input, text)
  } else {
    input.value = text
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

interface HarnessProps {
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | null) => void
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onDismiss?: () => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  options?: CaseOption[]
  inputProps?: Record<string, unknown>
  inputId?: string
  popoverId?: string
}

function Harness({
  value,
  defaultValue = null,
  onChange,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  open,
  defaultOpen = false,
  onOpen,
  onDismiss,
  onOpenChange,
  disabled,
  options = caseOptions,
  inputProps,
  inputId,
  popoverId,
}: HarnessProps) {
  return (
    <Combobox
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      inputValue={inputValue}
      defaultInputValue={defaultInputValue}
      onInputValueChange={onInputValueChange}
      open={open}
      defaultOpen={defaultOpen}
      onOpen={onOpen}
      onDismiss={onDismiss}
      onOpenChange={onOpenChange}
      disabled={disabled}
    >
      <Field>
        <Combobox.Input placeholder="Search..." id={inputId} {...inputProps} />
      </Field>
      <Combobox.Popover id={popoverId}>
        <Listbox>
          {options.map(opt => (
            <Listbox.Option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </Listbox.Option>
          ))}
        </Listbox>
      </Combobox.Popover>
    </Combobox>
  )
}

describe('Combobox quarantine reconciliation (CB case IDs)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('CB-DOM-01/CB-A11Y-01: renders a transparent coordinator with honest roles across shapes', async () => {
    // Transparent root without a Field bezel: the input is a direct child
    // of the mount container (Combobox adds no host node).
    const bare = await mount(
      <Combobox>
        <Combobox.Input />
      </Combobox>
    )
    const bareInput = inputOf(bare.container)
    expect(bareInput).toBeTruthy()
    expect(bareInput.parentElement).toBe(bare.container)
    await unmount(bare.container, bare.root)

    const { container, root } = await mount(<Harness />)
    const input = inputOf(container)

    expect(input).toBeTruthy()
    expect(input.tagName).toBe('INPUT')
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
    expect(input.getAttribute('aria-haspopup')).toBe('listbox')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    // Closed: no popover DOM anywhere.
    expect(popoverOf()).toBeNull()
    await unmount(container, root)

    // Open: popover is a native div with presentation role; the nested
    // Listbox owns role=listbox (no invented/duplicated collection role).
    const opened = await mount(<Harness defaultOpen />)
    const popover = popoverOf()
    expect(popover).toBeTruthy()
    expect(popover!.tagName).toBe('DIV')
    expect(popover!.getAttribute('role')).toBe('presentation')
    expect(popover!.querySelector('[role="listbox"]')).toBeTruthy()
    const controls = inputOf(opened.container).getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    expect(popover!.id).toBe(controls)
    await unmount(opened.container, opened.root)

    // Select-only: Trigger stays a native button with combobox state.
    const selectOnly = await mount(
      <Combobox value="alpha" onChange={() => {}} defaultOpen>
        <Combobox.Trigger>Alpha</Combobox.Trigger>
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const trigger = triggerOf(selectOnly.container)
    expect(trigger).toBeTruthy()
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('type')).toBe('button')
    expect(trigger.getAttribute('role')).toBe('combobox')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger.getAttribute('aria-controls')).toBe(popoverOf()!.id)
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      optionOf('alpha')!.id
    )
    await unmount(selectOnly.container, selectOnly.root)
  })

  it('CB-DOM-05: exposes an active descendant only for a real mounted option while open', async () => {
    function Dynamic() {
      const [options, setOptions] = React.useState(caseOptions)
      const [open, setOpen] = React.useState(true)
      return (
        <>
          <button data-testid="remove-bravo" onClick={() => setOptions(o => o.filter(x => x.value !== 'bravo'))} />
          <button data-testid="close" onClick={() => setOpen(false)} />
          <Combobox value="bravo" onChange={() => {}} open={open} onOpen={() => setOpen(true)} onDismiss={() => setOpen(false)}>
            <Field>
              <Combobox.Input />
            </Field>
            <Combobox.Popover>
              <Listbox>
                {options.map(opt => (
                  <Listbox.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </>
      )
    }
    const { container, root } = await mount(<Dynamic />)
    const input = inputOf(container)

    // Valid open/mounted state: real option ID exposed.
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)

    // Removing the active option clears the reference (never dangling).
    await React.act(async () => {
      container.querySelector('[data-testid="remove-bravo"]')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    })
    expect(optionOf('bravo')).toBeNull()
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)

    // Closing also omits the reference.
    await React.act(async () => {
      container.querySelector('[data-testid="close"]')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    })
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)

    await unmount(container, root)
  })

  it('CB-DOM-06: honors explicit IDs and keeps generated peers unique', async () => {
    const first = await mount(
      <Harness defaultOpen inputId="explicit-input" popoverId="explicit-pop" />
    )
    const input = inputOf(first.container)
    expect(input.id).toBe('explicit-input')
    expect(input.getAttribute('aria-controls')).toBe('explicit-pop')
    expect(popoverOf()!.id).toBe('explicit-pop')
    const generatedPeerId = input.getAttribute('aria-controls')
    await unmount(first.container, first.root)

    // Generated IDs stay unique across roots.
    const second = await mount(<Harness defaultOpen />)
    const third = await mount(<Harness defaultOpen />)
    const idA = inputOf(second.container).getAttribute('aria-controls')!
    const idB = inputOf(third.container).getAttribute('aria-controls')!
    expect(idA).toBeTruthy()
    expect(idB).toBeTruthy()
    expect(idA).not.toBe(idB)
    expect(idA).not.toBe(generatedPeerId)
    await unmount(second.container, second.root)
    await unmount(third.container, third.root)

    // Changing the explicit popover ID switches the linkage in the same commit.
    function Switchable() {
      const [id, setId] = React.useState('pop-one')
      return (
        <>
          <button data-testid="switch" onClick={() => setId('pop-two')} />
          <Harness defaultOpen popoverId={id} />
        </>
      )
    }
    const switched = await mount(<Switchable />)
    expect(inputOf(switched.container).getAttribute('aria-controls')).toBe('pop-one')
    await React.act(async () => {
      switched.container.querySelector('[data-testid="switch"]')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    })
    expect(inputOf(switched.container).getAttribute('aria-controls')).toBe('pop-two')
    expect(popoverOf()!.id).toBe('pop-two')
    await unmount(switched.container, switched.root)
  })

  it('CB-DOM-07: preserves native props, editing attributes, events, and refs', async () => {
    const onFocus = vi.fn()
    const ref = React.createRef<HTMLInputElement>()
    const rerendered = await mount(
      <Combobox defaultOpen={false}>
        <Field>
          <Combobox.Input
            ref={ref}
            className="custom-class"
            data-testid="native-input"
            name="framework"
            autoComplete="off"
            spellCheck={false}
            inputMode="search"
            onFocus={onFocus}
          />
        </Field>
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const input = inputOf(rerendered.container)
    expect(input.className).toContain('custom-class')
    expect(input.getAttribute('data-testid')).toBe('native-input')
    expect(input.getAttribute('name')).toBe('framework')
    expect(input.getAttribute('autocomplete')).toBe('off')
    expect(input.getAttribute('spellcheck')).toBe('false')
    expect(input.getAttribute('inputmode')).toBe('search')
    expect(ref.current).toBe(input)

    await React.act(async () => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(onFocus).toHaveBeenCalledTimes(1)
    // The anchor still works: focusing opened the popover.
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(popoverOf()).toBeTruthy()
    await unmount(rerendered.container, rerendered.root)
  })

  it('CB-DOM-08: diagnoses ambiguous focus-source or popup anatomy', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Input + Trigger: exactly-one-source diagnostic.
    const both = await mount(
      <Combobox open={false} onOpen={() => {}} onDismiss={() => {}}>
        <Combobox.Input />
        <Combobox.Trigger>Choose</Combobox.Trigger>
      </Combobox>
    )
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('requires exactly one focus source')
    )
    await unmount(both.container, both.root)

    // Duplicate popovers (mounted via open state): at-most-one diagnostic.
    errorSpy.mockClear()
    const dup = await mount(
      <Combobox open onOpen={() => {}} onDismiss={() => {}}>
        <Combobox.Input />
        <Combobox.Popover>
          <div>First</div>
        </Combobox.Popover>
        <Combobox.Popover>
          <div>Second</div>
        </Combobox.Popover>
      </Combobox>
    )
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('allows at most one Popover')
    )
    await unmount(dup.container, dup.root)

    // No focus source: exactly-one-source diagnostic.
    errorSpy.mockClear()
    const none = await mount(
      <Combobox open={false} onOpen={() => {}} onDismiss={() => {}}>
        <div>No source</div>
      </Combobox>
    )
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('requires exactly one focus source')
    )
    await unmount(none.container, none.root)

    // Valid anatomy stays silent.
    errorSpy.mockClear()
    const valid = await mount(<Harness defaultOpen />)
    expect(errorSpy).not.toHaveBeenCalled()
    await unmount(valid.container, valid.root)
  })

  it('CB-DOM-09: keeps popover content absent while closed', async () => {
    const { container, root } = await mount(<Harness />)
    expect(inputOf(container).getAttribute('aria-expanded')).toBe('false')
    expect(popoverOf()).toBeNull()
    expect(document.body.querySelector('[role="listbox"]')).toBeNull()
    await unmount(container, root)
  })

  it('CB-DOM-10 partial: applies list autocomplete and empty-text defaults', async () => {
    const { container, root } = await mount(
      <Combobox defaultOpen>
        <Field>
          <Combobox.Input />
        </Field>
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const input = inputOf(container)
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
    expect(input.value).toBe('')
    await unmount(container, root)
  })

  it('CB-DOM-11: root inputValue wins over forbidden Input value props with a diagnostic', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container, root } = await mount(
      <Combobox inputValue="Alpha" onInputValueChange={() => {}} defaultOpen>
        <Field>
          {/* @ts-expect-error value is forbidden on Combobox.Input by design */}
          <Combobox.Input value="Bravo" />
        </Field>
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    expect(inputOf(container).value).toBe('Alpha')
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('does not accept value or defaultValue')
    )
    await unmount(container, root)

    errorSpy.mockClear()
    const second = await mount(
      <Combobox inputValue="Alpha" onInputValueChange={() => {}} defaultOpen>
        <Field>
          {/* @ts-expect-error defaultValue is forbidden on Combobox.Input by design */}
          <Combobox.Input defaultValue="Charlie" />
        </Field>
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    expect(inputOf(second.container).value).toBe('Alpha')
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('does not accept value or defaultValue')
    )
    await unmount(second.container, second.root)
  })

  it('CB-OPEN-05: keeps expanded ARIA and popover DOM controlled when open requests are rejected', async () => {
    const onOpen = vi.fn()
    const { container, root } = await mount(
      <Harness open={false} onOpen={onOpen} />
    )
    const input = inputOf(container)

    await React.act(async () => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(onOpen).toHaveBeenCalled()
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(popoverOf()).toBeNull()

    await pressKey(input, 'ArrowDown')
    await React.act(async () => {
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(popoverOf()).toBeNull()
    await unmount(container, root)
  })

  it('CB-OPEN-06: applies programmatic open and close without user callbacks', async () => {
    const onOpen = vi.fn()
    const onDismiss = vi.fn()
    const onOpenChange = vi.fn()
    const { container, root } = await mount(
      <Harness open={false} onOpen={onOpen} onDismiss={onDismiss} onOpenChange={onOpenChange} />
    )
    const input = inputOf(container)
    expect(input.getAttribute('aria-expanded')).toBe('false')

    await React.act(async () => {
      root.render(
        <Harness open onOpen={onOpen} onDismiss={onDismiss} onOpenChange={onOpenChange} />
      )
    })
    expect(inputOf(container).getAttribute('aria-expanded')).toBe('true')
    expect(popoverOf()).toBeTruthy()

    await React.act(async () => {
      root.render(
        <Harness open={false} onOpen={onOpen} onDismiss={onDismiss} onOpenChange={onOpenChange} />
      )
    })
    expect(inputOf(container).getAttribute('aria-expanded')).toBe('false')
    expect(popoverOf()).toBeNull()

    expect(onOpen).not.toHaveBeenCalled()
    expect(onDismiss).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
    await unmount(container, root)
  })

  it('CB-OPEN-07: lets consumer preventDefault cancel an ArrowDown open', async () => {
    const onOpen = vi.fn()
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => e.preventDefault())
    const { container, root } = await mount(
      <Harness open={false} onOpen={onOpen} inputProps={{ onKeyDown }} />
    )
    const input = inputOf(container)

    await React.act(async () => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(onOpen).toHaveBeenCalledTimes(1)

    await pressKey(input, 'ArrowDown')
    expect(onKeyDown).toHaveBeenCalled()
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await unmount(container, root)
  })

  it('CB-OPEN-08: keeps readOnly and disabled sources from requesting open', async () => {
    const onOpen = vi.fn()
    const { container, root } = await mount(
      <Harness open={false} onOpen={onOpen} inputProps={{ readOnly: true }} />
    )
    const input = inputOf(container)
    await React.act(async () => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await pressKey(input, 'ArrowDown')
    await pressKey(input, 'Enter')
    expect(onOpen).not.toHaveBeenCalled()
    await unmount(container, root)

    const onOpen2 = vi.fn()
    const second = await mount(
      <Harness open={false} onOpen={onOpen2} inputProps={{ disabled: true }} />
    )
    const disabledInput = inputOf(second.container)
    expect(disabledInput.disabled).toBe(true)
    await React.act(async () => {
      disabledInput.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
      disabledInput.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(onOpen2).not.toHaveBeenCalled()
    await unmount(second.container, second.root)
  })

  it('CB-EDIT-01: keeps DOM focus in the input while arrows move the active option', async () => {
    const { container, root } = await mount(<Harness defaultOpen />)
    const input = inputOf(container)
    input.focus()
    expect(document.activeElement).toBe(input)

    await pressKey(input, 'ArrowDown')
    expect(document.activeElement).toBe(input)
    await pressKey(input, 'ArrowDown')
    expect(document.activeElement).toBe(input)
    await unmount(container, root)
  })

  it('CB-EDIT-02: routes a native edit through one inputValue request, never onChange', async () => {
    const onInputValueChange = vi.fn()
    const onChange = vi.fn()
    const { container, root } = await mount(
      <Harness
        value={null}
        onChange={onChange}
        inputValue=""
        onInputValueChange={onInputValueChange}
        defaultOpen
      />
    )
    const input = inputOf(container)
    await React.act(async () => {
      typeText(input, 'a')
    })
    expect(onInputValueChange).toHaveBeenCalledTimes(1)
    expect(onInputValueChange).toHaveBeenCalledWith('a')
    expect(onChange).not.toHaveBeenCalled()
    await unmount(container, root)
  })

  it('CB-EDIT-05/CB-EDIT-06/CB-EDIT-09: suppresses option commands during IME composition, resumes after', async () => {
    const onChange = vi.fn()
    const onDismiss = vi.fn()
    const { container, root } = await mount(
      <Harness value="alpha" onChange={onChange} onDismiss={onDismiss} defaultOpen />
    )
    const input = inputOf(container)
    const alpha = optionOf('alpha')!
    expect(alpha.hasAttribute('data-active')).toBe(true)

    await React.act(async () => {
      input.dispatchEvent(new Event('compositionstart', { bubbles: true }))
    })

    // Enter / Tab / Escape / arrows are inert while composing.
    await pressKey(input, 'Enter')
    await pressKey(input, 'Tab')
    await pressKey(input, 'Escape')
    await pressKey(input, 'ArrowDown')
    expect(onChange).not.toHaveBeenCalled()
    expect(onDismiss).not.toHaveBeenCalled()
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(alpha.hasAttribute('data-active')).toBe(true)

    // After compositionend the same keys work exactly once.
    await React.act(async () => {
      input.dispatchEvent(new Event('compositionend', { bubbles: true }))
    })
    await pressKey(input, 'ArrowDown')
    expect(optionOf('bravo')!.hasAttribute('data-active')).toBe(true)
    await pressKey(input, 'Enter')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('bravo')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await unmount(container, root)
  })

  it('CB-EDIT-07: restores rejected controlled text without a split DOM value', async () => {
    const onInputValueChange = vi.fn()
    const { container, root } = await mount(
      <Harness inputValue="Alpha" onInputValueChange={onInputValueChange} defaultOpen />
    )
    const input = inputOf(container)
    expect(input.value).toBe('Alpha')

    await React.act(async () => {
      typeText(input, 'Alp')
    })
    expect(onInputValueChange).toHaveBeenCalledWith('Alp')

    // Parent ignores the request: rerendering restores the controlled text.
    await React.act(async () => {
      root.render(
        <Harness inputValue="Alpha" onInputValueChange={onInputValueChange} defaultOpen />
      )
    })
    expect(inputOf(container).value).toBe('Alpha')
    await unmount(container, root)
  })

  it('CB-NAV-03: exposes no active ID for empty or all-disabled collections', async () => {
    const empty = await mount(<Harness defaultOpen options={[]} />)
    expect(inputOf(empty.container).hasAttribute('aria-activedescendant')).toBe(false)
    await pressKey(inputOf(empty.container), 'ArrowDown')
    expect(inputOf(empty.container).hasAttribute('aria-activedescendant')).toBe(false)
    await unmount(empty.container, empty.root)

    const disabled = await mount(
      <Harness
        defaultOpen
        value={null}
        options={[
          { value: 'alpha', label: 'Alpha', disabled: true },
          { value: 'bravo', label: 'Bravo', disabled: true },
        ]}
      />
    )
    const disabledInput = inputOf(disabled.container)
    expect(disabledInput.hasAttribute('aria-activedescendant')).toBe(false)
    await pressKey(disabledInput, 'ArrowDown')
    expect(disabledInput.hasAttribute('aria-activedescendant')).toBe(false)
    await unmount(disabled.container, disabled.root)
  })

  it('CB-NAV-04: leaves PageUp and PageDown native instead of jumping suggestions', async () => {
    const onChange = vi.fn()
    const onInputValueChange = vi.fn()
    const { container, root } = await mount(
      <Harness
        value="bravo"
        onChange={onChange}
        onInputValueChange={onInputValueChange}
        defaultOpen
      />
    )
    const input = inputOf(container)
    expect(optionOf('bravo')!.hasAttribute('data-active')).toBe(true)

    for (const key of ['PageDown', 'PageUp']) {
      const prevented = await pressKey(input, key)
      expect(prevented).toBe(false)
      expect(optionOf('bravo')!.hasAttribute('data-active')).toBe(true)
    }
    expect(onChange).not.toHaveBeenCalled()
    expect(onInputValueChange).not.toHaveBeenCalled()
    await unmount(container, root)
  })

  it('CB-NAV-06: preserves active identity as the selection changes', async () => {
    const onChange = vi.fn()
    const { container, root } = await mount(
      <Harness value="alpha" onChange={onChange} defaultOpen />
    )
    expect(inputOf(container).getAttribute('aria-activedescendant')).toBe(
      optionOf('alpha')!.id
    )

    await React.act(async () => {
      root.render(<Harness value="bravo" onChange={onChange} defaultOpen />)
    })
    expect(inputOf(container).getAttribute('aria-activedescendant')).toBe(
      optionOf('bravo')!.id
    )
    expect(optionOf('bravo')!.hasAttribute('data-active')).toBe(true)
    await unmount(container, root)
  })

  it('CB-NAV-07: clears a stale active descendant whose option unmounted; Enter commits nothing', async () => {
    const onChange = vi.fn()
    function Dynamic() {
      const [options, setOptions] = React.useState(caseOptions)
      return (
        <>
          <button data-testid="remove-bravo" onClick={() => setOptions(o => o.filter(x => x.value !== 'bravo'))} />
          <Combobox value="bravo" onChange={onChange} defaultOpen>
            <Field>
              <Combobox.Input />
            </Field>
            <Combobox.Popover>
              <Listbox>
                {options.map(opt => (
                  <Listbox.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </Combobox.Popover>
          </Combobox>
        </>
      )
    }
    const { container, root } = await mount(<Dynamic />)
    const input = inputOf(container)
    input.focus()
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)

    await React.act(async () => {
      container.querySelector('[data-testid="remove-bravo"]')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    })
    expect(optionOf('bravo')).toBeNull()
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)

    // Enter with only a stale active value: native, commits nothing, focus kept.
    const prevented = await pressKey(input, 'Enter')
    expect(prevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
    await unmount(container, root)
  })

  it('CB-MODE-02 default: navigation preserves typed text in list mode', async () => {
    const { container, root } = await mount(
      <Harness value={null} onChange={() => {}} defaultOpen />
    )
    const input = inputOf(container)
    await React.act(async () => {
      typeText(input, 'a')
    })
    expect(input.value).toBe('a')

    await pressKey(input, 'ArrowDown')
    expect(input.value).toBe('a')
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)
    await unmount(container, root)
  })

  it('CB-COMMIT-01: commits the active option on Enter with one ordered callback sequence', async () => {
    const calls: string[] = []
    const { container, root } = await mount(
      <Combobox
        value={null}
        onChange={v => calls.push(`change:${v}`)}
        onInputValueChange={v => calls.push(`input:${v}`)}
        onDismiss={() => calls.push('dismiss')}
        defaultOpen
      >
        <Field>
          <Combobox.Input />
        </Field>
        <Combobox.Popover>
          <Listbox>
            {caseOptions.map(opt => (
              <Listbox.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Listbox.Option>
            ))}
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const input = inputOf(container)
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)

    await pressKey(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('alpha')!.id)

    const prevented = await pressKey(input, 'Enter')
    expect(prevented).toBe(true)
    expect(calls).toEqual(['change:alpha', 'input:Alpha', 'dismiss'])
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await unmount(container, root)
  })

  it('CB-COMMIT-06: emits no second selection when focus leaves after an accepted commit', async () => {
    const onChange = vi.fn()
    const { container, root } = await mount(
      <Harness value={null} onChange={onChange} defaultOpen />
    )
    const input = inputOf(container)
    await pressKey(input, 'ArrowDown')
    await pressKey(input, 'Enter')
    expect(onChange).toHaveBeenCalledTimes(1)

    await React.act(async () => {
      input.dispatchEvent(new Event('blur', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    await unmount(container, root)
  })

  it('CB-COMMIT-08: prevents an open Enter commit from submitting its containing form', async () => {
    const onSubmit = vi.fn()
    const { container, root } = await mount(
      <form
        onSubmit={e => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <Harness value={null} onChange={() => {}} defaultOpen />
      </form>
    )
    const input = inputOf(container)
    await pressKey(input, 'ArrowDown')
    const prevented = await pressKey(input, 'Enter')
    // The commit consumes the key so no implicit submission follows.
    expect(prevented).toBe(true)
    expect(onSubmit).not.toHaveBeenCalled()
    await unmount(container, root)
  })

  it('CB-COMMIT-09: leaves Tab entirely native when the popup is closed', async () => {
    const onChange = vi.fn()
    const { container, root } = await mount(
      <Harness value="alpha" onChange={onChange} />
    )
    const input = inputOf(container)
    const prevented = await pressKey(input, 'Tab')
    expect(prevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    await unmount(container, root)
  })

  it('CB-REVERT-01: restores the last committed text and dismisses on open Escape', async () => {
    const onChange = vi.fn()
    const onInputValueChange = vi.fn()
    const onDismiss = vi.fn()
    const { container, root } = await mount(
      <Harness
        value="alpha"
        onChange={onChange}
        defaultInputValue="Alpha"
        onInputValueChange={onInputValueChange}
        onDismiss={onDismiss}
        defaultOpen
      />
    )
    const input = inputOf(container)
    input.focus()
    expect(input.value).toBe('Alpha')

    // Edit to unmatched text and activate another option.
    await React.act(async () => {
      typeText(input, 'Alp')
    })
    await pressKey(input, 'ArrowDown')
    expect(input.value).toBe('Alp')

    await pressKey(input, 'Escape')
    // Text restoration request for the committed label, no value change.
    expect(onInputValueChange).toHaveBeenLastCalledWith('Alpha')
    expect(input.value).toBe('Alpha')
    expect(onChange).not.toHaveBeenCalled()
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(input)
    await unmount(container, root)
  })

  it('CB-REVERT-04: leaves committed state and Escape propagation untouched while closed', async () => {
    const onChange = vi.fn()
    const onInputValueChange = vi.fn()
    const onDismiss = vi.fn()
    const ancestorKeys: string[] = []
    const { container, root } = await mount(
      <div onKeyDown={() => ancestorKeys.push('escape')}>
        <Harness
          value="alpha"
          onChange={onChange}
          defaultInputValue="Alpha"
          onInputValueChange={onInputValueChange}
          onDismiss={onDismiss}
        />
      </div>
    )
    const input = inputOf(container)
    input.focus()
    const prevented = await pressKey(input, 'Escape')
    expect(prevented).toBe(false)
    expect(input.value).toBe('Alpha')
    expect(onChange).not.toHaveBeenCalled()
    expect(onInputValueChange).not.toHaveBeenCalled()
    expect(onDismiss).not.toHaveBeenCalled()
    expect(ancestorKeys).toEqual(['escape'])
    await unmount(container, root)
  })

  it('CB-REVERT-05: exposes commit intent without mutating rejected controlled state', async () => {
    const onChange = vi.fn()
    const onDismiss = vi.fn()
    const { container, root } = await mount(
      <Harness value="alpha" onChange={onChange} open onDismiss={onDismiss} />
    )
    const bravo = optionOf('bravo')!
    await React.act(async () => {
      bravo.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('bravo')
    expect(onDismiss).toHaveBeenCalledTimes(1)

    // Parent ignores every request: open stays, selected state stays on alpha.
    expect(popoverOf()).toBeTruthy()
    expect(optionOf('alpha')!.getAttribute('data-state')).toBe('selected')
    expect(optionOf('bravo')!.getAttribute('data-state')).toBe('unselected')
    await unmount(container, root)
  })

  it('CB-REVERT-06: never rewrites controlled inputValue from a programmatic value change', async () => {
    const { container, root } = await mount(
      <Harness value="alpha" onChange={() => {}} inputValue="Alpha" onInputValueChange={() => {}} defaultOpen />
    )
    expect(inputOf(container).value).toBe('Alpha')
    await React.act(async () => {
      root.render(
        <Harness value="bravo" onChange={() => {}} inputValue="Alpha" onInputValueChange={() => {}} defaultOpen />
      )
    })
    expect(inputOf(container).value).toBe('Alpha')
    await unmount(container, root)
  })

  it('CB-SELECT-06/CB-SELECT-07: trigger defaults to type button and ignores disabled activation', async () => {
    const onOpen = vi.fn()
    const { container, root } = await mount(
      <Combobox value={null} onChange={() => {}} open={false} onOpen={onOpen} onDismiss={() => {}}>
        <Combobox.Trigger>Choose</Combobox.Trigger>
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const trigger = triggerOf(container)
    expect(trigger.getAttribute('type')).toBe('button')
    await unmount(container, root)

    const onOpen2 = vi.fn()
    const second = await mount(
      <Combobox value={null} onChange={() => {}} open={false} onOpen={onOpen2} onDismiss={() => {}} disabled>
        <Combobox.Trigger>Choose</Combobox.Trigger>
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    await React.act(async () => {
      triggerOf(second.container).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(onOpen2).not.toHaveBeenCalled()
    await unmount(second.container, second.root)
  })

  it('CB-CLOSE-04: clears open and active semantics immediately on close', async () => {
    const { container, root } = await mount(
      <Harness value="bravo" onChange={() => {}} open onOpen={() => {}} onDismiss={() => {}} />
    )
    const input = inputOf(container)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)

    await React.act(async () => {
      root.render(
        <Harness value="bravo" onChange={() => {}} open={false} onOpen={() => {}} onDismiss={() => {}} />
      )
    })
    expect(inputOf(container).getAttribute('aria-expanded')).toBe('false')
    expect(inputOf(container).hasAttribute('aria-activedescendant')).toBe(false)
    expect(popoverOf()).toBeNull()
    await unmount(container, root)
  })

  it('CB-ENV-01: hydrates closed anatomy and IDs without a mounted active descendant', () => {
    const html = renderToString(
      <Combobox>
        <Field>
          <Combobox.Input />
        </Field>
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-controls="ref-cb-pop-')
    expect(html).not.toContain('aria-activedescendant')
  })

  it('CB-ENV-02: issues one registration and one request per action under StrictMode', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onOpen = vi.fn()
    const { container, root } = await mount(
      <React.StrictMode>
        <Harness open={false} onOpen={onOpen} onDismiss={() => {}} />
      </React.StrictMode>
    )
    const input = inputOf(container)
    await React.act(async () => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('focus source')
    )
    await unmount(container, root)
  })

  it('CB-ENV-05: keeps collection registration bounded with inline-rendered options', async () => {
    const items = [
      { value: 'alpha', label: 'Alpha' },
      { value: 'bravo', label: 'Bravo' },
      { value: 'charlie', label: 'Charlie' },
      { value: 'delta', label: 'Delta' },
      { value: 'echo', label: 'Echo' },
    ]
    function Inline() {
      const [query, setQuery] = React.useState('')
      return (
        <Combobox defaultOpen inputValue={query} onInputValueChange={setQuery}>
          <Field>
            <Combobox.Input />
          </Field>
          <Combobox.Popover>
            <Listbox>
              {items.map(item => (
                <Listbox.Option key={item.value} value={item.value}>
                  {item.label}
                </Listbox.Option>
              ))}
            </Listbox>
          </Combobox.Popover>
        </Combobox>
      )
    }
    const { container, root } = await mount(
      <React.StrictMode>
        <Inline />
      </React.StrictMode>
    )
    const input = inputOf(container)
    await React.act(async () => {
      typeText(input, 'a')
    })
    await React.act(async () => {
      typeText(input, 'al')
    })
    // Bounded: one live node per item, active identity stable by value.
    expect(document.body.querySelectorAll('[data-value]').length).toBe(5)
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('alpha')!.id)
    await unmount(container, root)
  })

  it('LB-CB-03 valid shape: option activation calls only Combobox onChange once', async () => {
    const onChange = vi.fn()
    const { container, root } = await mount(
      <Harness value="alpha" onChange={onChange} defaultOpen />
    )
    const bravo = optionOf('bravo')!
    await React.act(async () => {
      bravo.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('bravo')
    await unmount(container, root)
  })

  it('uncontrolled value/input/open work end-to-end without callbacks (API freeze pin)', async () => {
    // No value/input/open callbacks at all: the component owns its state.
    const { container, root } = await mount(
      <Harness defaultValue="react" defaultInputValue={undefined} options={[
        { value: 'react', label: 'React' },
        { value: 'vue', label: 'Vue' },
      ]} />
    )
    const input = inputOf(container)
    // Uncontrolled input seeds from the default value.
    expect(input.value).toBe('react')
    expect(input.getAttribute('aria-expanded')).toBe('false')

    // Typing updates the DOM with no handlers attached.
    await React.act(async () => {
      typeText(input, 'zzz')
    })
    expect(input.value).toBe('zzz')
    expect(input.getAttribute('aria-expanded')).toBe('true')

    // Clicking an option commits internally and fills the label.
    await React.act(async () => {
      optionOf('vue')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.value).toBe('Vue')
    await unmount(container, root)

    // defaultOpen + defaultInputValue compose the same way.
    const second = await mount(
      <Harness defaultValue={null} defaultInputValue="Hello" defaultOpen options={[
        { value: 'react', label: 'React' },
      ]} />
    )
    const secondInput = inputOf(second.container)
    expect(secondInput.value).toBe('Hello')
    expect(secondInput.getAttribute('aria-expanded')).toBe('true')
    await pressKey(secondInput, 'Escape')
    expect(secondInput.getAttribute('aria-expanded')).toBe('false')
    await unmount(second.container, second.root)
  })
})

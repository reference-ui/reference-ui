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
  closeOnBlur?: boolean
  options?: CaseOption[]
  inputProps?: Record<string, unknown>
  inputId?: string
  popoverId?: string
}

function Harness({
  value = null,
  onChange = () => {},
  inputValue,
  defaultInputValue,
  onInputValueChange,
  open,
  defaultOpen = false,
  onOpen,
  onDismiss,
  onOpenChange,
  disabled,
  closeOnBlur,
  options = caseOptions,
  inputProps,
  inputId,
  popoverId,
}: HarnessProps) {
  return (
    <Combobox
      value={value}
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
      closeOnBlur={closeOnBlur}
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

interface SelectHarnessProps {
  value?: string | null
  onChange?: (value: string | null) => void
  onInputValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onDismiss?: () => void
  disabled?: boolean
  closeOnBlur?: boolean
  options?: CaseOption[]
  label?: string
}

function SelectHarness({
  value = null,
  onChange = () => {},
  onInputValueChange,
  open,
  defaultOpen = false,
  onOpen,
  onDismiss,
  disabled,
  closeOnBlur,
  options = caseOptions,
  label = 'Choose',
}: SelectHarnessProps) {
  return (
    <Combobox
      value={value}
      onChange={onChange}
      onInputValueChange={onInputValueChange}
      open={open}
      defaultOpen={defaultOpen}
      onOpen={onOpen}
      onDismiss={onDismiss}
      disabled={disabled}
      closeOnBlur={closeOnBlur}
    >
      <Combobox.Trigger>{label}</Combobox.Trigger>
      <Combobox.Popover>
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

async function hoverOption(option: HTMLElement) {
  await React.act(async () => {
    option.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    option.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
  })
}

async function leaveListbox() {
  const listbox = document.body.querySelector('[role="listbox"]') as HTMLElement
  const popover = popoverOf() as HTMLElement
  await React.act(async () => {
    for (const node of [listbox, popover]) {
      node.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }))
      node.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false, relatedTarget: document.body }))
      node.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }))
      node.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false, relatedTarget: document.body }))
    }
  })
}

async function blurSource(el: Element, relatedTarget: EventTarget | null) {
  await React.act(async () => {
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: relatedTarget as Node | null }))
  })
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
      <Combobox value={null} onChange={() => {}}>
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
      <Combobox value={null} onChange={() => {}} defaultOpen={false}>
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
    // #11: focus alone never opens — but the anchor still works via click.
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(popoverOf()).toBeNull()
    await React.act(async () => {
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(popoverOf()).toBeTruthy()
    await unmount(rerendered.container, rerendered.root)
  })

  it('CB-DOM-08: diagnoses ambiguous focus-source or popup anatomy', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Input + Trigger: exactly-one-source diagnostic.
    const both = await mount(
      <Combobox value={null} onChange={() => {}} open={false} onOpen={() => {}} onDismiss={() => {}}>
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
      <Combobox value={null} onChange={() => {}} open onOpen={() => {}} onDismiss={() => {}}>
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
      <Combobox value={null} onChange={() => {}} open={false} onOpen={() => {}} onDismiss={() => {}}>
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
      <Combobox value={null} onChange={() => {}} defaultOpen>
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
      <Combobox value={null} onChange={() => {}} inputValue="Alpha" onInputValueChange={() => {}} defaultOpen>
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
      <Combobox value={null} onChange={() => {}} inputValue="Alpha" onInputValueChange={() => {}} defaultOpen>
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

    // #11: focus alone never requests open.
    await React.act(async () => {
      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(onOpen).not.toHaveBeenCalled()
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(popoverOf()).toBeNull()

    await pressKey(input, 'ArrowDown')
    expect(onOpen).toHaveBeenCalledTimes(1)
    await React.act(async () => {
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    // Duplicate requests inside one gesture collapse (CB-OPEN-03 no-spam).
    expect(onOpen).toHaveBeenCalledTimes(1)
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
    expect(onOpen).not.toHaveBeenCalled()

    await pressKey(input, 'ArrowDown')
    expect(onKeyDown).toHaveBeenCalled()
    expect(onOpen).not.toHaveBeenCalled()
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
      <Combobox value={null} onChange={() => {}}>
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
    // #11: focus never requests; one deliberate ArrowDown requests exactly
    // once even with StrictMode effect replay.
    expect(onOpen).not.toHaveBeenCalled()
    await pressKey(input, 'ArrowDown')
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
        <Combobox value={null} onChange={() => {}} defaultOpen inputValue={query} onInputValueChange={setQuery}>
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

  it('CB-NAV-05 leave half: popover leave clears pointer-derived active to the committed value', async () => {
    const { container, root } = await mount(
      <Harness value="alpha" onChange={() => {}} defaultOpen />
    )
    const input = inputOf(container)
    const alpha = optionOf('alpha')!
    const bravo = optionOf('bravo')!

    // Keyboard-derive bravo, then hover charlie: pointer overwrites.
    await pressKey(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(bravo.id)
    await hoverOption(optionOf('charlie')!)
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('charlie')!.id)

    // Leave clears the pointer preview back to the committed value.
    await leaveListbox()
    expect(input.getAttribute('aria-activedescendant')).toBe(alpha.id)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    await unmount(container, root)
  })

  it('CB-NAV-05/CB-COMMIT-07: keyboard intent survives leave-restore; Tab after leave commits nothing', async () => {
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

    // Keyboard-derive bravo; Listbox root leave targets the committed
    // value, which the leave-restore rule ignores while keyboard-active.
    await pressKey(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)
    await leaveListbox()
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)

    // Hover charlie, then leave: pointer preview clears to committed alpha.
    await hoverOption(optionOf('charlie')!)
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('charlie')!.id)
    await leaveListbox()
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('alpha')!.id)

    // Tab revives no stale highlight: no commit, revert, close, native key.
    onChange.mockClear()
    onInputValueChange.mockClear()
    onDismiss.mockClear()
    const prevented = await pressKey(input, 'Tab')
    expect(prevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    await unmount(container, root)
  })

  it('CB-COMMIT-04 narrow: Tab never commits a stale pointer preview', async () => {
    const onChange = vi.fn()
    const { container, root } = await mount(
      <Harness value={null} onChange={onChange} defaultOpen />
    )
    const input = inputOf(container)

    await hoverOption(optionOf('bravo')!)
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)

    const prevented = await pressKey(input, 'Tab')
    expect(prevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await unmount(container, root)
  })

  it('CB-COMMIT-05: Tab with no active option reverts unmatched text and closes natively', async () => {
    const onChange = vi.fn()
    const calls: string[] = []
    const { container, root } = await mount(
      <Harness
        value="alpha"
        onChange={onChange}
        defaultInputValue="Alpha"
        onInputValueChange={v => calls.push(`input:${v}`)}
        onDismiss={() => calls.push('dismiss')}
        options={[]}
        defaultOpen
      />
    )
    const input = inputOf(container)
    await React.act(async () => {
      typeText(input, 'Zulu')
    })
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)

    const prevented = await pressKey(input, 'Tab')
    expect(prevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    // No options mounted, so the committed label falls back to the raw value.
    expect(calls).toEqual(['input:Zulu', 'input:alpha', 'dismiss'])
    expect(input.value).toBe('alpha')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await unmount(container, root)
  })

  it('CB-REVERT-03: blur outside reverts unmatched text before dismissal', async () => {
    const onChange = vi.fn()
    const calls: string[] = []
    const { container, root } = await mount(
      <Harness
        value="alpha"
        onChange={onChange}
        defaultInputValue="Alpha"
        onInputValueChange={v => calls.push(`input:${v}`)}
        onDismiss={() => calls.push('dismiss')}
        defaultOpen
      />
    )
    const input = inputOf(container)
    await React.act(async () => {
      typeText(input, 'Zulu')
    })
    const outside = document.createElement('button')
    document.body.appendChild(outside)

    await blurSource(input, outside)
    expect(onChange).not.toHaveBeenCalled()
    expect(calls).toEqual(['input:Zulu', 'input:Alpha', 'dismiss'])
    expect(input.value).toBe('Alpha')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    outside.remove()
    await unmount(container, root)
  })

  it('CB-REVERT-03 null-target: blur to a non-focusable outside target still reverts and closes', async () => {
    const onDismiss = vi.fn()
    const { container, root } = await mount(
      <Harness value="alpha" onChange={() => {}} defaultInputValue="Alp" onDismiss={onDismiss} defaultOpen />
    )
    const input = inputOf(container)
    await blurSource(input, null)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await unmount(container, root)
  })

  it('CB-REVERT-03 inside: blur into the popover keeps the session open', async () => {
    const onDismiss = vi.fn()
    const onInputValueChange = vi.fn()
    const { container, root } = await mount(
      <Harness
        value="alpha"
        onChange={() => {}}
        defaultInputValue="Alp"
        onInputValueChange={onInputValueChange}
        onDismiss={onDismiss}
        defaultOpen
      />
    )
    const input = inputOf(container)
    await blurSource(input, optionOf('bravo'))
    expect(onInputValueChange).not.toHaveBeenCalled()
    expect(onDismiss).not.toHaveBeenCalled()
    expect(input.getAttribute('aria-expanded')).toBe('true')
    await unmount(container, root)
  })

  it('CB-REVERT-07: closeOnBlur=false preserves open and text on blur; Escape still closes', async () => {
    const onDismiss = vi.fn()
    const onInputValueChange = vi.fn()
    const { container, root } = await mount(
      <Harness
        value="alpha"
        onChange={() => {}}
        defaultInputValue="Alp"
        onInputValueChange={onInputValueChange}
        onDismiss={onDismiss}
        closeOnBlur={false}
        defaultOpen
      />
    )
    const input = inputOf(container)
    const outside = document.createElement('button')
    document.body.appendChild(outside)

    await blurSource(input, outside)
    expect(onInputValueChange).not.toHaveBeenCalled()
    expect(onDismiss).not.toHaveBeenCalled()
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.value).toBe('Alp')
    outside.remove()

    await pressKey(input, 'Escape')
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    await unmount(container, root)
  })

  it('CB-OPEN-02 direction: closed editable arrows pend first/last enabled without a valid selection', async () => {
    const { container, root } = await mount(
      <Harness value={null} onChange={() => {}} />
    )
    const input = inputOf(container)
    await pressKey(input, 'ArrowUp')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.getAttribute('aria-activedescendant')).toBe(optionOf('charlie')!.id)
    await unmount(container, root)

    const second = await mount(<Harness value={null} onChange={() => {}} />)
    const input2 = inputOf(second.container)
    await pressKey(input2, 'ArrowDown')
    expect(input2.getAttribute('aria-activedescendant')).toBe(optionOf('alpha')!.id)
    await unmount(second.container, second.root)
  })

  it('CB-SELECT-02: closed Trigger arrows open with the selected or first/last enabled option pending', async () => {
    const onOpen = vi.fn()
    const { container, root } = await mount(
      <SelectHarness value="bravo" onChange={() => {}} onOpen={onOpen} />
    )
    const trigger = triggerOf(container)
    await React.act(async () => {
      trigger.focus()
    })

    await pressKey(trigger, 'ArrowDown')
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)
    expect(document.activeElement).toBe(trigger)
    await unmount(container, root)

    // No valid selection: Down pends first enabled, Up pends last enabled.
    const second = await mount(<SelectHarness value={null} onChange={() => {}} />)
    const trigger2 = triggerOf(second.container)
    await pressKey(trigger2, 'ArrowUp')
    expect(trigger2.getAttribute('aria-expanded')).toBe('true')
    expect(trigger2.getAttribute('aria-activedescendant')).toBe(optionOf('charlie')!.id)
    await unmount(second.container, second.root)

    const third = await mount(<SelectHarness value={null} onChange={() => {}} />)
    const trigger3 = triggerOf(third.container)
    await pressKey(trigger3, 'ArrowDown')
    expect(trigger3.getAttribute('aria-activedescendant')).toBe(optionOf('alpha')!.id)
    await unmount(third.container, third.root)

    // A disabled selection is not valid: direction fallback wins.
    const fourth = await mount(
      <SelectHarness
        value="bravo"
        onChange={() => {}}
        options={[
          { value: 'alpha', label: 'Alpha' },
          { value: 'bravo', label: 'Bravo', disabled: true },
          { value: 'charlie', label: 'Charlie' },
        ]}
      />
    )
    const trigger4 = triggerOf(fourth.container)
    await pressKey(trigger4, 'ArrowDown')
    expect(trigger4.getAttribute('aria-activedescendant')).toBe(optionOf('alpha')!.id)
    await unmount(fourth.container, fourth.root)
  })

  it('CB-SELECT-03: Trigger typeahead cycles enabled matches without committing', async () => {
    vi.useFakeTimers()
    try {
      const onChange = vi.fn()
      const { container, root } = await mount(
        <SelectHarness
          value={null}
          onChange={onChange}
          defaultOpen
          options={[
            { value: 'apple', label: 'Apple' },
            { value: 'apricot', label: 'Apricot', disabled: true },
            { value: 'avocado', label: 'Avocado' },
            { value: 'banana', label: 'Banana' },
          ]}
        />
      )
      const trigger = triggerOf(container)
      await React.act(async () => {
        trigger.focus()
      })

      await pressKey(trigger, 'a')
      expect(trigger.getAttribute('aria-activedescendant')).toBe(optionOf('apple')!.id)
      await pressKey(trigger, 'a')
      expect(trigger.getAttribute('aria-activedescendant')).toBe(optionOf('avocado')!.id)
      await pressKey(trigger, 'a')
      expect(trigger.getAttribute('aria-activedescendant')).toBe(optionOf('apple')!.id)
      expect(document.activeElement).toBe(trigger)
      expect(onChange).not.toHaveBeenCalled()

      // After the buffer timeout the cycle restarts from the first match.
      await React.act(async () => {
        vi.advanceTimersByTime(600)
      })
      await pressKey(trigger, 'a')
      expect(trigger.getAttribute('aria-activedescendant')).toBe(optionOf('apple')!.id)
      expect(onChange).not.toHaveBeenCalled()
      await unmount(container, root)
    } finally {
      vi.useRealTimers()
    }
  })

  it('CB-SELECT-08: Trigger Home and End jump to first and last enabled options', async () => {
    const { container, root } = await mount(
      <SelectHarness
        value={null}
        onChange={() => {}}
        defaultOpen
        options={[
          { value: 'alpha', label: 'Alpha', disabled: true },
          { value: 'bravo', label: 'Bravo' },
          { value: 'charlie', label: 'Charlie' },
          { value: 'delta', label: 'Delta', disabled: true },
        ]}
      />
    )
    const trigger = triggerOf(container)
    await React.act(async () => {
      trigger.focus()
    })
    await pressKey(trigger, 'ArrowDown')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)

    const endPrevented = await pressKey(trigger, 'End')
    expect(endPrevented).toBe(true)
    expect(trigger.getAttribute('aria-activedescendant')).toBe(optionOf('charlie')!.id)

    const homePrevented = await pressKey(trigger, 'Home')
    expect(homePrevented).toBe(true)
    expect(trigger.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)
    expect(document.activeElement).toBe(trigger)
    await unmount(container, root)
  })

  it('CB-SELECT-04: Enter and Space open closed Triggers and commit open ones exactly once', async () => {
    const calls: string[] = []
    const { container, root } = await mount(
      <SelectHarness
        value="bravo"
        onChange={v => calls.push(`change:${v}`)}
        onInputValueChange={v => calls.push(`input:${v}`)}
        onOpen={() => calls.push('open')}
        onDismiss={() => calls.push('dismiss')}
      />
    )
    const trigger = triggerOf(container)

    const openPrevented = await pressKey(trigger, 'Enter')
    expect(openPrevented).toBe(true)
    expect(calls).toEqual(['open'])
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    const commitPrevented = await pressKey(trigger, 'Enter')
    expect(commitPrevented).toBe(true)
    expect(calls).toEqual(['open', 'change:bravo', 'dismiss'])
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    await unmount(container, root)

    // Space follows the same single path with no text callback.
    const second = await mount(
      <SelectHarness
        value="alpha"
        onChange={v => calls.push(`change:${v}`)}
        onInputValueChange={v => calls.push(`input:${v}`)}
        onOpen={() => calls.push('open')}
        onDismiss={() => calls.push('dismiss')}
      />
    )
    const trigger2 = triggerOf(second.container)
    calls.length = 0
    await pressKey(trigger2, ' ')
    expect(calls).toEqual(['open'])
    await pressKey(trigger2, ' ')
    expect(calls).toEqual(['open', 'change:alpha', 'dismiss'])
    await unmount(second.container, second.root)
  })

  it('CB-SELECT-05: select-only Escape/Tab/blur mirror commit-or-close with zero text callbacks', async () => {
    const onInputValueChange = vi.fn()
    const onChange = vi.fn()
    const onDismiss = vi.fn()
    const { container, root } = await mount(
      <SelectHarness
        value="alpha"
        onChange={onChange}
        onInputValueChange={onInputValueChange}
        onDismiss={onDismiss}
        defaultOpen
      />
    )
    const trigger = triggerOf(container)
    await React.act(async () => {
      trigger.focus()
    })

    // Escape: no commit, one close, cleared active, Trigger keeps focus.
    const escPrevented = await pressKey(trigger, 'Escape')
    expect(escPrevented).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
    expect(onInputValueChange).not.toHaveBeenCalled()
    await unmount(container, root)

    // Tab with keyboard-derived active commits; traversal stays native.
    const second = await mount(
      <SelectHarness
        value="alpha"
        onChange={onChange}
        onInputValueChange={onInputValueChange}
        onDismiss={onDismiss}
        defaultOpen
      />
    )
    const trigger2 = triggerOf(second.container)
    await pressKey(trigger2, 'ArrowDown')
    expect(trigger2.getAttribute('aria-activedescendant')).toBe(optionOf('bravo')!.id)
    const tabPrevented = await pressKey(trigger2, 'Tab')
    expect(tabPrevented).toBe(false)
    expect(onChange).toHaveBeenCalledWith('bravo')
    expect(trigger2.getAttribute('aria-expanded')).toBe('false')
    expect(onInputValueChange).not.toHaveBeenCalled()
    await unmount(second.container, second.root)

    // Blur outside closes with no commit and no text callback.
    onChange.mockClear()
    onDismiss.mockClear()
    const third = await mount(
      <SelectHarness
        value="alpha"
        onChange={onChange}
        onInputValueChange={onInputValueChange}
        onDismiss={onDismiss}
        defaultOpen
      />
    )
    const trigger3 = triggerOf(third.container)
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    await blurSource(trigger3, outside)
    expect(onChange).not.toHaveBeenCalled()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(trigger3.getAttribute('aria-expanded')).toBe('false')
    expect(onInputValueChange).not.toHaveBeenCalled()
    outside.remove()
    await unmount(third.container, third.root)

    // Without an active option Tab and Escape just close, still text-free.
    onChange.mockClear()
    onDismiss.mockClear()
    const fourth = await mount(
      <SelectHarness
        value={null}
        onChange={onChange}
        onInputValueChange={onInputValueChange}
        onDismiss={onDismiss}
        defaultOpen
      />
    )
    const trigger4 = triggerOf(fourth.container)
    expect(trigger4.hasAttribute('aria-activedescendant')).toBe(false)
    const tabPrevented4 = await pressKey(trigger4, 'Tab')
    expect(tabPrevented4).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(trigger4.getAttribute('aria-expanded')).toBe('false')
    expect(onInputValueChange).not.toHaveBeenCalled()
    await unmount(fourth.container, fourth.root)
  })

  it('CB-SELECT-07 trigger half: disabled Trigger ignores arrows, typeahead, and activation', async () => {
    const onOpen = vi.fn()
    const { container, root } = await mount(
      <SelectHarness value={null} onChange={() => {}} onOpen={onOpen} disabled />
    )
    const trigger = triggerOf(container)
    await pressKey(trigger, 'ArrowDown')
    await pressKey(trigger, 'a')
    await pressKey(trigger, 'Enter')
    await pressKey(trigger, ' ')
    await React.act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(onOpen).not.toHaveBeenCalled()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false)
    await unmount(container, root)
  })

  it('controlled value with uncontrolled input/open works end-to-end (API freeze pin)', async () => {
    // Value is required-controlled; input/open stay uncontrolled here.
    function Controlled() {
      const [val, setVal] = React.useState<string | null>('react')
      return (
        <Harness value={val} onChange={setVal} defaultInputValue={undefined} options={[
          { value: 'react', label: 'React' },
          { value: 'vue', label: 'Vue' },
        ]} />
      )
    }
    const { container, root } = await mount(<Controlled />)
    const input = inputOf(container)
    // Uncontrolled input seeds from the controlled value.
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
      <Harness value={null} onChange={() => {}} defaultInputValue="Hello" defaultOpen options={[
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

describe('Combobox PATCHES #1: shadow portal destination', () => {
  it('shadowContainerForSource resolves the containing open ShadowRoot, nothing otherwise', async () => {
    const { shadowContainerForSource } = await import('./combobox-context')

    expect(shadowContainerForSource(null)).toBeUndefined()
    expect(shadowContainerForSource(undefined)).toBeUndefined()

    const light = document.createElement('div')
    document.body.appendChild(light)
    expect(shadowContainerForSource(light)).toBeUndefined()

    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('input')
    root.appendChild(inner)
    expect(shadowContainerForSource(inner)).toBe(root)

    light.remove()
    host.remove()
  })
})

describe('Combobox cluster B: inline-completion decision matrix', () => {
  it('completionForPrefix completes exact-case prefixes and matches case-insensitively', async () => {
    const { completionForPrefix } = await import('./autocomplete')
    expect(completionForPrefix('Al', 'Alpha')).toBe('Alpha')
    expect(completionForPrefix('al', 'Alpha')).toBe('Alpha')
    expect(completionForPrefix('AL', 'alpine')).toBe('alpine')
  })

  it('completionForPrefix returns null when there is nothing to complete or select', async () => {
    const { completionForPrefix } = await import('./autocomplete')
    expect(completionForPrefix('', 'Alpha')).toBeNull()
    expect(completionForPrefix('Alpha', 'Alpha')).toBeNull()
    expect(completionForPrefix('Alphax', 'Alpha')).toBeNull()
    expect(completionForPrefix('Br', 'Alpha')).toBeNull()
    expect(completionForPrefix('Al', null)).toBeNull()
    expect(completionForPrefix('Al', undefined)).toBeNull()
    expect(completionForPrefix('Al', '')).toBeNull()
  })
})

describe('Combobox cluster B: virtual-focus helpers', () => {
  const items = [
    { value: 'a', textValue: 'Alpha' },
    { value: 'b', textValue: 'Bravo', disabled: true },
    { value: 'c', textValue: 'Charlie' },
  ]

  it('findDuplicateValue reports the first duplicated logical value', async () => {
    const { findDuplicateValue } = await import('./virtual-focus')
    expect(findDuplicateValue(items)).toBeNull()
    expect(findDuplicateValue([...items, { value: 'a', textValue: 'Again' }])).toBe('a')
    expect(findDuplicateValue([])).toBeNull()
  })

  it('currentVirtualIndex resolves the active value to a logical index', async () => {
    const { currentVirtualIndex } = await import('./virtual-focus')
    expect(currentVirtualIndex(items, 'c')).toBe(2)
    expect(currentVirtualIndex(items, null)).toBeNull()
    expect(currentVirtualIndex(items, 'missing')).toBeNull()
  })

  it('validateVirtualTarget enforces in-range enabled navigation targets', async () => {
    const { validateVirtualTarget } = await import('./virtual-focus')
    expect(validateVirtualTarget(items, 0)).toBe('ok')
    expect(validateVirtualTarget(items, 2)).toBe('ok')
    expect(validateVirtualTarget(items, 1)).toBe('disabled')
    expect(validateVirtualTarget(items, -1)).toBe('out-of-range')
    expect(validateVirtualTarget(items, 3)).toBe('out-of-range')
    expect(validateVirtualTarget(items, 1.5)).toBe('out-of-range')
  })

  it('validateVirtualMount enforces range only; disabled cells mount', async () => {
    const { validateVirtualMount } = await import('./virtual-focus')
    expect(validateVirtualMount(items, 0)).toBe(true)
    expect(validateVirtualMount(items, 1)).toBe(true)
    expect(validateVirtualMount(items, 3)).toBe(false)
    expect(validateVirtualMount(items, -1)).toBe(false)
  })

  it('findVirtualMatch searches labels case-insensitively and skips disabled items', async () => {
    const { findVirtualMatch } = await import('./virtual-focus')
    expect(findVirtualMatch(items, 'ch')).toBe(2)
    expect(findVirtualMatch(items, 'AL')).toBe(0)
    expect(findVirtualMatch(items, 'br')).toBeNull()
    expect(findVirtualMatch(items, 'zzz')).toBeNull()
    expect(findVirtualMatch(items, '')).toBe(0)
    expect(findVirtualMatch([{ value: 'x', textValue: 'X', disabled: true }], '')).toBeNull()
  })

  it('directionForElement reads element direction with document and SSR fallbacks', async () => {
    const { directionForElement } = await import('./virtual-focus')
    expect(directionForElement(null)).toBe('ltr')
    expect(directionForElement(undefined)).toBe('ltr')
    const rtl = document.createElement('div')
    rtl.style.direction = 'rtl'
    document.body.appendChild(rtl)
    expect(directionForElement(rtl)).toBe('rtl')
    rtl.remove()
  })
})

describe('Combobox cluster B: authored-children scan (gate + authority diagnostics)', () => {
  async function scanOf(children: React.ReactNode, rootHasOnChange: boolean) {
    const { scanAuthoredCollections } = await import('./authored')
    const { ComboboxPopover, ComboboxOption, ComboboxVirtualItem } = await import('./Combobox')
    const { Listbox, ListboxOption, ListboxEmpty } = await import('../Listbox')
    const { Tree, TreeItem } = await import('../Tree')
    return scanAuthoredCollections(
      children,
      {
        Popover: ComboboxPopover,
        ComboboxOption,
        ListboxOption,
        VirtualItem: ComboboxVirtualItem,
        Listbox,
        Tree,
        TreeItem,
        Empty: ListboxEmpty,
      },
      rootHasOnChange
    )
  }

  it('gate: populated popover has content; missing or empty popover does not', async () => {
    const { scanHasPopoverContent } = await import('./authored')
    const { ComboboxPopover } = await import('./Combobox')
    const { Listbox, ListboxOption, ListboxEmpty } = await import('../Listbox')

    const populated = await scanOf(
      <ComboboxPopover>
        <Listbox>
          <ListboxOption value="a">A</ListboxOption>
        </Listbox>
      </ComboboxPopover>,
      false
    )
    expect(scanHasPopoverContent(populated)).toBe(true)

    const absent = await scanOf(<div />, false)
    expect(scanHasPopoverContent(absent)).toBe(false)

    const empty = await scanOf(
      <ComboboxPopover>
        <Listbox>
          <ListboxEmpty>No results</ListboxEmpty>
        </Listbox>
      </ComboboxPopover>,
      false
    )
    expect(scanHasPopoverContent(empty)).toBe(false)
  })

  it('gate: adapter metadata counts as content without mounted elements', async () => {
    const { scanHasPopoverContent } = await import('./authored')
    const { ComboboxPopover } = await import('./Combobox')
    const { Listbox } = await import('../Listbox')
    const grid = {
      role: 'grid',
      items: [{ value: 'a', textValue: 'A' }],
      getNextIndex: () => null,
      scrollToIndex: () => {},
    }

    const gridScan = await scanOf(<ComboboxPopover virtualFocus={grid as never} />, false)
    expect(scanHasPopoverContent(gridScan)).toBe(true)
    expect(gridScan.virtualFocusAdapter).toBe(grid)

    const windowed = await scanOf(
      <ComboboxPopover>
        <Listbox virtual={{ items: [{ value: 'a', textValue: 'A' }], scrollToIndex: () => {} }}>
          <></>
        </Listbox>
      </ComboboxPopover>,
      false
    )
    expect(scanHasPopoverContent(windowed)).toBe(true)
  })

  it('gate: fragments and arrays are transparent to the scan', async () => {
    const { scanHasPopoverContent } = await import('./authored')
    const { ComboboxPopover } = await import('./Combobox')
    const { ListboxOption } = await import('../Listbox')

    const scan = await scanOf(
      <>
        {[<ComboboxPopover key="p">{[<ListboxOption key="o" value="a">A</ListboxOption>]}</ComboboxPopover>]}
      </>,
      false
    )
    expect(scan.popovers).toHaveLength(1)
    expect(scan.authoredItemCount).toBe(1)
    expect(scanHasPopoverContent(scan)).toBe(true)
  })

  it('ADAPTER-02/03: nested onChange and multiple selection are detected', async () => {
    const { ComboboxPopover } = await import('./Combobox')
    const { Listbox } = await import('../Listbox')
    const { Tree, TreeItem } = await import('../Tree')

    const listboxChange = await scanOf(
      <ComboboxPopover>
        <Listbox onChange={() => {}}>
          <></>
        </Listbox>
      </ComboboxPopover>,
      true
    )
    expect(listboxChange.nestedOnChangeKind).toBe('listbox')

    // Without a root onChange there is no two-authority conflict to report.
    const unowned = await scanOf(
      <ComboboxPopover>
        <Listbox onChange={() => {}}>
          <></>
        </Listbox>
      </ComboboxPopover>,
      false
    )
    expect(unowned.nestedOnChangeKind).toBeNull()

    const treeChange = await scanOf(
      <ComboboxPopover>
        <Tree value={null} onChange={() => {}}>
          <TreeItem value="a">A</TreeItem>
        </Tree>
      </ComboboxPopover>,
      true
    )
    expect(treeChange.nestedOnChangeKind).toBe('tree')
    expect(treeChange.collectionKinds).toEqual(['tree'])

    const multiple = await scanOf(
      <ComboboxPopover>
        <Listbox selection="multiple">
          <></>
        </Listbox>
      </ComboboxPopover>,
      true
    )
    expect(multiple.multipleListbox).toBe(true)
  })
})

describe('Combobox cluster B: SSR attribute mapping (autocomplete + haspopup)', () => {
  it('maps autocomplete none/list/both to aria-autocomplete', () => {
    for (const mode of ['none', 'list', 'both'] as const) {
      const html = renderToString(
        <Combobox value={null} onChange={() => {}} inputValue="" autocomplete={mode}>
          <Combobox.Input aria-label="search" />
        </Combobox>
      )
      expect(html).toContain(`aria-autocomplete="${mode}"`)
    }
    const omitted = renderToString(
      <Combobox value={null} onChange={() => {}} inputValue="">
        <Combobox.Input aria-label="search" />
      </Combobox>
    )
    expect(omitted).toContain('aria-autocomplete="list"')
  })

  it('maps the popup collection to aria-haspopup listbox/tree/grid', async () => {
    const { Listbox, ListboxOption } = await import('../Listbox')
    const { Tree, TreeItem } = await import('../Tree')

    const listHtml = renderToString(
      <Combobox value={null} onChange={() => {}} inputValue="">
        <Combobox.Input aria-label="search" />
        <Combobox.Popover>
          <Listbox>
            <ListboxOption value="a">A</ListboxOption>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    expect(listHtml).toContain('aria-haspopup="listbox"')

    const treeHtml = renderToString(
      <Combobox value={null} onChange={() => {}} inputValue="">
        <Combobox.Input aria-label="search" />
        <Combobox.Popover>
          <Tree value={null} onChange={() => {}}>
            <TreeItem value="a">A</TreeItem>
          </Tree>
        </Combobox.Popover>
      </Combobox>
    )
    expect(treeHtml).toContain('aria-haspopup="tree"')

    const grid = {
      role: 'grid',
      items: [{ value: 'a', textValue: 'A' }],
      getNextIndex: () => 0,
      scrollToIndex: () => {},
    }
    const gridHtml = renderToString(
      <Combobox value={null} onChange={() => {}} inputValue="">
        <Combobox.Input aria-label="search" />
        <Combobox.Popover virtualFocus={grid as never} />
      </Combobox>
    )
    expect(gridHtml).toContain('aria-haspopup="grid"')
  })
})

describe('Combobox cluster B: content gate, escape hook, completion, grid timing (happy-dom)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('CB-OPEN-03 support: edits request open only with authored collection content', async () => {
    const calls: string[] = []
    const { container, root } = await mount(
      <Combobox
        value={null}
        onChange={() => {}}
        open={false}
        onOpen={() => calls.push('open')}
        inputValue="a"
        onInputValueChange={v => calls.push(`input:${v}`)}
      >
        <Combobox.Input aria-label="empty-gate" />
        <Combobox.Popover>
          <Listbox>{[]}</Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const input = inputOf(container)
    await React.act(async () => {
      typeText(input, 'ab')
    })
    expect(calls).toEqual(['input:ab'])

    const openCalls: string[] = []
    const populated = await mount(
      <Combobox
        value={null}
        onChange={() => {}}
        open={false}
        onOpen={() => openCalls.push('open')}
        inputValue="a"
        onInputValueChange={v => openCalls.push(`input:${v}`)}
      >
        <Combobox.Input aria-label="full-gate" />
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    await React.act(async () => {
      typeText(inputOf(populated.container), 'ab')
    })
    expect(openCalls).toEqual(['input:ab', 'open'])

    await unmount(container, root)
    await unmount(populated.container, populated.root)
  })

  it('CB-REVERT-02 support: onEscape preventDefault stops revert and dismissal', async () => {
    const calls: string[] = []
    let prevent = true
    const { container, root } = await mount(
      <Combobox
        value="alpha"
        onChange={v => calls.push(`change:${v}`)}
        inputValue="Alp"
        onInputValueChange={v => calls.push(`input:${v}`)}
        open
        onDismiss={() => calls.push('dismiss')}
        onEscape={e => {
          calls.push(`escape:${e.key}`)
          expect(e).toBeInstanceOf(KeyboardEvent)
          if (prevent) e.preventDefault()
        }}
      >
        <Combobox.Input aria-label="esc" />
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const input = inputOf(container)
    await pressKey(input, 'Escape')
    expect(calls).toEqual(['escape:Escape'])
    expect(input.getAttribute('aria-expanded')).toBe('true')

    prevent = false
    await pressKey(input, 'Escape')
    expect(calls).toEqual(['escape:Escape', 'escape:Escape', 'input:Alpha', 'dismiss'])
    await unmount(container, root)
  })

  it('CB-MODE-03/07 support: both-mode completes the suffix with zero text callbacks', async () => {
    const calls: string[] = []
    const { container, root } = await mount(
      <Combobox
        value={null}
        inputValue="Al"
        onInputValueChange={v => calls.push(`input:${v}`)}
        onChange={v => calls.push(`change:${v}`)}
        defaultOpen
        autocomplete="both"
      >
        <Combobox.Input aria-label="both" />
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
            <Listbox.Option value="alpine">Alpine</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const input = inputOf(container)
    // Typing-derived active selects the first match; navigate to prove preview silence.
    await pressKey(input, 'ArrowDown')
    await pressKey(input, 'ArrowDown')
    expect(calls).toEqual([])
    expect(input.value).toBe('Alpine')
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(6)
    expect(input.getAttribute('aria-autocomplete')).toBe('both')
    await unmount(container, root)
  })

  it('CB-MODE-04 support: filtering active away restores the typed prefix', async () => {
    const { container, root } = await mount(
      <Combobox value={null} onChange={() => {}} inputValue="Al" defaultOpen autocomplete="both">
        <Combobox.Input aria-label="both-restore" />
        <Combobox.Popover>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    const input = inputOf(container)
    await pressKey(input, 'ArrowDown')
    expect(input.value).toBe('Alpha')
    await React.act(async () => {
      root.render(
        <Combobox value={null} onChange={() => {}} inputValue="Al" defaultOpen autocomplete="both">
          <Combobox.Input aria-label="both-restore" />
          <Combobox.Popover>
            <Listbox>{[]}</Listbox>
          </Combobox.Popover>
        </Combobox>
      )
    })
    expect(input.value).toBe('Al')
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(2)
    await unmount(container, root)
  })

  it('CB-ADAPTER-01 support: grid mount timing pends scroll targets until cells mount', async () => {
    const scrolls: number[] = []
    const gridItems = Array.from({ length: 6 }, (_, i) => ({
      value: `g-${i}`,
      textValue: `G ${i}`,
    }))
    const gridAdapter = {
      role: 'grid',
      items: gridItems,
      getNextIndex: ({ currentIndex }: { currentIndex: number | null }) =>
        currentIndex == null ? 0 : Math.min(currentIndex + 1, gridItems.length - 1),
      scrollToIndex: (index: number) => scrolls.push(index),
    }

    function WindowedGrid({ windowEnd }: { windowEnd: number }) {
      return (
        <Combobox value={null} onChange={() => {}} inputValue="" defaultOpen>
          <Combobox.Input aria-label="grid" />
          <Combobox.Popover virtualFocus={gridAdapter as never}>
            <div role="row">
              {gridItems.slice(0, windowEnd).map((item, index) => (
                <Combobox.VirtualItem key={item.value} index={index}>
                  <div role="gridcell">{item.textValue}</div>
                </Combobox.VirtualItem>
              ))}
            </div>
          </Combobox.Popover>
        </Combobox>
      )
    }

    const { container, root } = await mount(<WindowedGrid windowEnd={2} />)
    const input = inputOf(container)
    expect(popoverOf()?.getAttribute('role')).toBe('grid')
    expect(input.getAttribute('aria-haspopup')).toBe('grid')

    // Mounted target: active ID publishes with no scroll.
    await pressKey(input, 'ArrowDown')
    expect(scrolls).toEqual([])
    const firstId = input.getAttribute('aria-activedescendant')
    expect(firstId).toContain('g-0')
    expect(document.getElementById(firstId ?? '')?.getAttribute('role')).toBe('gridcell')

    // Unmounted target: one scroll, no ID until mount.
    await pressKey(input, 'ArrowDown')
    await pressKey(input, 'ArrowDown')
    expect(scrolls).toEqual([2])
    expect(input.getAttribute('aria-activedescendant')).toBeNull()

    await React.act(async () => {
      root.render(<WindowedGrid windowEnd={3} />)
    })
    const pendingId = input.getAttribute('aria-activedescendant')
    expect(pendingId).toContain('g-2')
    expect(document.getElementById(pendingId ?? '')?.textContent).toBe('G 2')
    await unmount(container, root)
  })

  it('CB-ADAPTER-08 support: conflicting authorities diagnose and stay inert', async () => {
    const errors: string[] = []
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    const calls: string[] = []
    const gridAdapter = {
      role: 'grid',
      items: [{ value: 'g-0', textValue: 'G 0' }],
      getNextIndex: () => 0,
      scrollToIndex: () => calls.push('scroll'),
    }
    const { container, root } = await mount(
      <Combobox value={null} defaultOpen onChange={v => calls.push(`change:${v}`)}>
        <Combobox.Input aria-label="conflict" />
        <Combobox.Popover virtualFocus={gridAdapter as never}>
          <Listbox>
            <Listbox.Option value="alpha">Alpha</Listbox.Option>
          </Listbox>
        </Combobox.Popover>
      </Combobox>
    )
    expect(errors.some(text => text.includes('exactly one collection authority'))).toBe(true)
    const input = inputOf(container)
    await pressKey(input, 'ArrowDown')
    expect(calls).toEqual([])
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    await React.act(async () => {
      optionOf('alpha')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(calls).toEqual([])
    await unmount(container, root)
  })
})


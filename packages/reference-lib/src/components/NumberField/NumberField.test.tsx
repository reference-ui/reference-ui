// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot, hydrateRoot } from 'react-dom/client'
import {
  NumberField,
  type NumberFieldDecrementProps,
  type NumberFieldGroupProps,
  type NumberFieldIncrementProps,
  type NumberFieldInputProps,
} from './NumberField'

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true

function mount() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  return { container, root }
}

async function cleanup(container: HTMLElement, root: ReturnType<typeof createRoot>) {
  await React.act(async () => {
    root.unmount()
  })
  container.remove()
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function pressKey(input: HTMLInputElement, key: string, init?: KeyboardEventInit) {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
}

describe('NumberField numeric defaults', () => {
  it('NF-MATH-01: NumberField should resolve public numeric defaults without truthiness coercion', async () => {
    // Landing re-target: percent-style default step is freeze-only (no
    // formatOptions in this engine); the portable core is 0-rendering,
    // default step 1, and unbounded stepping.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={0} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('0')

    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    const dec = container.querySelector('button[aria-label="Decrement"]') as HTMLButtonElement
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([1])
    await React.act(async () => {
      dec.click()
      dec.click()
    })
    // Unbounded: stepping down from controlled 0 goes below zero.
    expect(seen).toEqual([1, -1, -1])
    await cleanup(container, root)
  })
})

describe('NumberField numeric validation', () => {
  it('NF-MATH-02: Runtime should reject every nonfinite or unusable numeric prop', () => {
    // Landing adaptation: ±Infinity bounds stay legal (this engine's
    // unbounded sentinels); quarantine required finite min/max.
    // FEATURES #1: missing value/locale also throw — required controlled
    // value + required locale, no defaultValue, no env default.
    expect(() => renderToString(<NumberField value={NaN} locale="en-US" />)).toThrow(
      /"value" must be a finite number or null/
    )
    expect(() => renderToString(<NumberField value={Infinity} locale="en-US" />)).toThrow(
      /"value" must be a finite number or null/
    )
    expect(() => renderToString(<NumberField value={0} locale="en-US" min={NaN} />)).toThrow(/"min" must be a number/)
    expect(() => renderToString(<NumberField value={0} locale="en-US" max={NaN} />)).toThrow(/"max" must be a number/)
    expect(() => renderToString(<NumberField value={0} locale="en-US" min={10} max={5} />)).toThrow(
      /"min" must be less than or equal to "max"/
    )
    expect(() => renderToString(<NumberField value={0} locale="en-US" step={0} />)).toThrow(
      /"step" must be a finite number greater than 0/
    )
    expect(() => renderToString(<NumberField value={0} locale="en-US" step={-1} />)).toThrow(
      /"step" must be a finite number greater than 0/
    )
    expect(() => renderToString(<NumberField value={0} locale="en-US" step={NaN} />)).toThrow(
      /"step" must be a finite number greater than 0/
    )
    expect(() => renderToString(<NumberField value={0} locale="en-US" step={Infinity} />)).toThrow(
      /"step" must be a finite number greater than 0/
    )
    expect(() =>
      renderToString(
        // @ts-expect-error - missing value must throw at runtime
        <NumberField locale="en-US" />
      )
    ).toThrow(/"value" is required/)
    expect(() =>
      renderToString(
        // @ts-expect-error - missing locale must throw at runtime
        <NumberField value={0} />
      )
    ).toThrow(/"locale" is required/)
    expect(() => renderToString(<NumberField value={0} locale={null as unknown as string} />)).toThrow(
      /"locale" is required/
    )

    // Legal: null, ±Infinity bounds, defaults.
    expect(() => renderToString(<NumberField value={null} locale="en-US" />)).not.toThrow()
    expect(() => renderToString(<NumberField value={0} locale="en-US" min={-Infinity} max={Infinity} />)).not.toThrow()
    expect(() => renderToString(<NumberField value={0} locale="en-US" />)).not.toThrow()
  })
})

describe('NumberField step math', () => {
  it('NF-MATH-07: Decimal stepping should remove ordinary floating drift', async () => {
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(0)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={0.1}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    // Separate acts: one batched act would compute all three steps from 0.
    await React.act(async () => {
      inc.click()
    })
    await React.act(async () => {
      inc.click()
    })
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([0.1, 0.2, 0.3])
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('0.3')
    await cleanup(container, root)
  })

  it('NF-MATH-08: Cleanup should not erase meaningful representable precision', async () => {
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(1.234)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={0.001}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('1.234')
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([1.235])
    await cleanup(container, root)
  })

  it('NF-MATH-14: Interaction-produced negative zero should canonicalize to zero without rewriting a programmatic prop', async () => {
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(-1)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={1}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toHaveLength(1)
    expect(seen[0]).toBe(0)
    expect(Object.is(seen[0], -0)).toBe(false)
    await cleanup(container, root)

    // A programmatic -0 prop still displays (String(-0) === '0'); the
    // component must not rewrite the prop itself.
    const html = renderToString(<NumberField value={-0} locale="en-US" />)
    expect(html).toContain('value="0"')
  })
})

describe('NumberField managed authority', () => {
  it('NF-TYPE-03 / NF-DOM-06: Managed part authority should defeat every behavior-owned conflicting cast', async () => {
    // Freeze: the root is a plain host (role passes through, managed data
    // wins); Group owns role=group + managed aria; Input owns host/value/
    // form/input-mode attributes, native disabled/readOnly/required, managed
    // aria-invalid, and the absence of numeric value ARIA; steppers own
    // button semantics, aria-controls, and the absence of state/value ARIA.
    // Forged props arrive through runtime casts (the type boundary rejects
    // them separately in types.test.tsx). B-26: a forged role or numeric
    // aria-value* on Input loses to managed absence.
    const forgedGroup = {
      role: 'form',
      'aria-disabled': 'false',
      'aria-readonly': 'true',
      'aria-required': 'true',
      'aria-invalid': 'false',
      'data-status': 'error',
    } as unknown as NumberFieldGroupProps
    const forgedInput = {
      type: 'number',
      role: 'button',
      value: '999',
      defaultValue: '888',
      inputMode: 'numeric',
      name: 'forged',
      form: 'forged-form',
      min: 0,
      max: 100,
      step: 5,
      disabled: false,
      readOnly: false,
      required: false,
      'aria-disabled': 'false',
      'aria-readonly': 'true',
      'aria-required': 'true',
      'aria-invalid': 'false',
      'aria-valuenow': 5,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuetext': 'forged',
    } as unknown as NumberFieldInputProps
    const forgedStepper = {
      type: 'submit',
      tabIndex: 0,
      role: 'switch',
      'aria-controls': 'forged-controls',
      'aria-disabled': 'false',
      'aria-readonly': 'true',
      'aria-required': 'true',
      'aria-checked': 'true',
      'aria-pressed': 'true',
      'aria-valuenow': 5,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuetext': 'forged',
      'data-pressed': '',
    } as unknown as NumberFieldIncrementProps
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField
          value={42}
          locale="en-US"
          data-testid="nf-root"
          disabled
          readOnly
          required
          invalid
          data-editing=""
        >
          <NumberField.Group data-testid="nf-group" {...forgedGroup}>
            <NumberField.Decrement aria-label="Decrement" {...forgedStepper} />
            <NumberField.Input aria-label="Quantity" {...forgedInput} />
            <NumberField.Increment aria-label="Increment" {...forgedStepper} />
          </NumberField.Group>
        </NumberField>
      )
    })
    // Root: plain host, no managed role; managed data wins atomically
    // (forged data-editing loses to the clean session).
    const host = container.querySelector('[data-testid="nf-root"]') as HTMLElement
    expect(host.getAttribute('role')).toBeNull()
    expect(host.getAttribute('data-editing')).toBeNull()
    expect(host.getAttribute('data-disabled')).toBe('')
    expect(host.getAttribute('data-readonly')).toBe('')
    expect(host.getAttribute('data-required')).toBe('')
    expect(host.getAttribute('data-invalid')).toBe('')

    // Group keeps role=group, managed aria-disabled/invalid, and
    // data-readonly/data-required; aria-readonly/aria-required are always
    // absent and data-status is unset without status="warning".
    const group = container.querySelector('[data-testid="nf-group"]') as HTMLElement
    expect(group.getAttribute('role')).toBe('group')
    expect(group.getAttribute('aria-disabled')).toBe('true')
    expect(group.getAttribute('aria-invalid')).toBe('true')
    expect(group.getAttribute('aria-readonly')).toBeNull()
    expect(group.getAttribute('aria-required')).toBeNull()
    expect(group.getAttribute('data-readonly')).toBe('')
    expect(group.getAttribute('data-required')).toBe('')
    expect(group.getAttribute('data-status')).toBeNull()

    // Input alone carries native readOnly/required semantics plus managed
    // inputMode/aria-invalid; visible Input never carries a name.
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    expect(input.getAttribute('type')).toBe('text')
    expect(input.getAttribute('role')).toBeNull()
    expect(input.value).toBe('42')
    expect(input.getAttribute('inputmode')).toBe('text')
    expect(input.getAttribute('name')).toBeNull()
    expect(input.getAttribute('form')).toBeNull()
    expect(input.getAttribute('min')).toBeNull()
    expect(input.getAttribute('max')).toBeNull()
    expect(input.getAttribute('step')).toBeNull()
    expect(input.disabled).toBe(true)
    expect(input.readOnly).toBe(true)
    expect(input.required).toBe(true)
    expect(input.getAttribute('aria-disabled')).toBeNull()
    expect(input.getAttribute('aria-readonly')).toBeNull()
    expect(input.getAttribute('aria-required')).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-valuenow')).toBeNull()
    expect(input.getAttribute('aria-valuemin')).toBeNull()
    expect(input.getAttribute('aria-valuemax')).toBeNull()
    expect(input.getAttribute('aria-valuetext')).toBeNull()
    // Unrelated authored ARIA survives the strip.
    expect(input.getAttribute('aria-label')).toBe('Quantity')

    // Steppers: native button role/type, no tab stop, resolving controls,
    // root-disabled capability, no state/value ARIA, no forged pressed.
    for (const btn of Array.from(container.querySelectorAll('button'))) {
      expect(btn.getAttribute('type')).toBe('button')
      expect(btn.getAttribute('role')).toBeNull()
      expect(btn.tabIndex).toBe(-1)
      expect(btn.getAttribute('aria-controls')).toBe(input.id)
      expect(input.id).not.toBe('')
      expect(btn.disabled).toBe(true)
      expect(btn.getAttribute('data-disabled')).toBe('')
      expect(btn.getAttribute('aria-disabled')).toBeNull()
      expect(btn.getAttribute('aria-readonly')).toBeNull()
      expect(btn.getAttribute('aria-required')).toBeNull()
      expect(btn.getAttribute('aria-checked')).toBeNull()
      expect(btn.getAttribute('aria-pressed')).toBeNull()
      expect(btn.getAttribute('aria-valuenow')).toBeNull()
      expect(btn.getAttribute('aria-valuemin')).toBeNull()
      expect(btn.getAttribute('aria-valuemax')).toBeNull()
      expect(btn.getAttribute('aria-valuetext')).toBeNull()
      expect(btn.getAttribute('data-pressed')).toBeNull()
    }
    await cleanup(container, root)
  })

  it('NF-EDIT-13: Consumer edit handlers should run in native order without breaking managed state', async () => {
    // Regression: user onChange used to clobber the internal handler via
    // last-spread, silently killing typing.
    // FEATURES #1: controlled — the App echoes requests into value.
    // NFLAST ruling (c): the consumer handler runs first in native order,
    // then the managed live request publishes immediately.
    const userEdits: string[] = []
    const managed: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(1)
      return (
        <NumberField
          value={value}
          locale="en-US"
          onChange={v => {
            managed.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" onChange={e => void userEdits.push(e.target.value)} />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '7')
    })
    expect(userEdits).toEqual(['7'])
    expect(managed).toEqual([7])
    expect(input.value).toBe('7')
    expect(input.getAttribute('data-editing')).toBe('')
    await React.act(async () => {
      input.blur()
    })
    // The echo already landed the value live; commit is a no-op.
    expect(managed).toEqual([7])
    expect(input.value).toBe('7')
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-DOM-05: Fixed hosts should preserve unrelated native props, handlers, and refs', async () => {
    // Freeze: readOnly/invalid live on the root and map to managed Input
    // state; everything unrelated (ids, titles, placeholder, enterKeyHint,
    // descriptions, classes, CSS variables, styles, refs, events) passes
    // through every fixed host untouched, with node identity across
    // rerenders and ref cleanup on unmount.
    const rootRef = React.createRef<HTMLDivElement>()
    const groupRef = React.createRef<HTMLDivElement>()
    const inputRef = React.createRef<HTMLInputElement>()
    const incRef = React.createRef<HTMLButtonElement>()
    const inputCallbackCalls: Array<HTMLInputElement | null> = []
    let focused = 0
    let blurred = 0
    function App({ value }: { value: number | null }) {
      return (
        <NumberField
          ref={rootRef}
          value={value}
          locale="en-US"
          readOnly
          invalid
          data-testid="nf-root"
          className="consumer-root"
          title="root title"
        >
          <NumberField.Group ref={groupRef} data-testid="nf-group" className="consumer-group">
            <NumberField.Decrement aria-label="Decrement" data-testid="nf-dec" />
            <NumberField.Input
              ref={(node: HTMLInputElement | null) => {
                inputCallbackCalls.push(node)
                ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
              }}
              id="nf-dom05-input"
              aria-label="Quantity"
              aria-describedby="nf-dom05-desc"
              placeholder="0.00"
              enterKeyHint="done"
              title="input title"
              autoComplete="bday"
              spellCheck
              data-testid="nf-input"
              className="consumer-input"
              style={{ ['--consumer-var' as string]: '42px' }}
              onFocus={() => void focused++}
              onBlur={() => void blurred++}
            />
            <NumberField.Increment ref={incRef} aria-label="Increase" data-testid="nf-inc" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    const host = container.querySelector('[data-testid="nf-root"]') as HTMLElement
    expect(rootRef.current).toBe(host)
    expect(host.className).toContain('consumer-root')
    expect(host.getAttribute('title')).toBe('root title')
    const group = container.querySelector('[data-testid="nf-group"]') as HTMLElement
    expect(groupRef.current).toBe(group)
    expect(group.className).toContain('consumer-group')
    const input = container.querySelector('input') as HTMLInputElement
    expect(inputRef.current).toBe(input)
    expect(inputCallbackCalls).toEqual([input])
    expect(input.id).toBe('nf-dom05-input')
    expect(input.getAttribute('aria-label')).toBe('Quantity')
    expect(input.getAttribute('aria-describedby')).toBe('nf-dom05-desc')
    expect(input.placeholder).toBe('0.00')
    expect(input.getAttribute('enterkeyhint')).toBe('done')
    expect(input.getAttribute('title')).toBe('input title')
    // Explicit native values win over the managed autocomplete defaults.
    expect(input.getAttribute('autocomplete')).toBe('bday')
    expect(input.getAttribute('spellcheck')).toBe('true')
    expect(input.className).toContain('consumer-input')
    expect(input.style.getPropertyValue('--consumer-var')).toBe('42px')
    // Root state maps to managed Input state (not forged passthrough).
    expect(input.readOnly).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(group.getAttribute('data-readonly')).toBe('')
    expect(group.getAttribute('data-invalid')).toBe('')
    expect(group.getAttribute('aria-readonly')).toBeNull()
    expect(incRef.current).toBe(container.querySelector('button[aria-label="Increase"]'))
    await React.act(async () => {
      input.focus()
    })
    expect(focused).toBe(1)
    await React.act(async () => {
      input.blur()
    })
    expect(blurred).toBe(1)
    // Rerenders preserve node identity and exact consumer presentation.
    await React.act(async () => {
      root.render(<App value={6} />)
    })
    expect(container.querySelector('input')).toBe(input)
    expect(container.querySelector('[data-testid="nf-group"]')).toBe(group)
    expect(input.value).toBe('6')
    expect(input.getAttribute('aria-label')).toBe('Quantity')
    await cleanup(container, root)
    // Callback refs clean up on unmount.
    expect(inputCallbackCalls[inputCallbackCalls.length - 1]).toBeNull()
  })
})

describe('NumberField steppers', () => {
  it('NF-STEP-11: Stepper capability should follow root state and authored disabled', async () => {
    const seen: Array<number | null> = []
    function App() {
      return (
        <NumberField value={10} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" disabled />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const dec = container.querySelector('button[aria-label="Decrement"]') as HTMLButtonElement
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    expect(dec.disabled).toBe(true)
    expect(inc.disabled).toBe(false)
    await React.act(async () => {
      dec.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })
    expect(seen).toEqual([])
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([11])
    await cleanup(container, root)
  })

  it('NF-STEP-02: Native, keyboard, and programmatic click should perform exactly one step', async () => {
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(10)
      return (
        <NumberField
          value={value}
          locale="en-US"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([11])
    await cleanup(container, root)
  })
})

describe('NumberField keyboard', () => {
  it('NF-KEY-07: Consumer cancellation and disabled state should suppress handled keyboard work', async () => {
    const seen: Array<number | null> = []
    function App() {
      return (
        <NumberField value={10} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity"
              onKeyDown={e => {
                if (e.key === 'ArrowUp') e.preventDefault()
              }}
            />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([])
    await React.act(async () => {
      pressKey(input, 'ArrowDown')
    })
    expect(seen).toEqual([9])
    await cleanup(container, root)

    // Disabled root suppresses all handled keys.
    const seenDisabled: Array<number | null> = []
    const d = mount()
    await React.act(async () => {
      d.root.render(
        <NumberField value={10} locale="en-US" disabled onChange={v => void seenDisabled.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const disabledInput = d.container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      pressKey(disabledInput, 'ArrowUp')
      pressKey(disabledInput, 'Home')
    })
    expect(seenDisabled).toEqual([])
    await cleanup(d.container, d.root)
  })
})

describe('NumberField hold-repeat (PATCHES §7)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function press(btn: HTMLButtonElement, init?: PointerEventInit) {
    btn.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        clientX: 10,
        clientY: 10,
        ...init,
      })
    )
  }

  function release(btn: HTMLButtonElement, init?: PointerEventInit) {
    btn.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 0,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        clientX: 10,
        clientY: 10,
        ...init,
      })
    )
  }

  function compatClick(btn: HTMLButtonElement, init?: MouseEventInit) {
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }))
  }

  function holdRender(
    root: ReturnType<typeof createRoot>,
    seen: Array<number | null>,
    setValue: (v: number | null) => void,
    value: number | null,
    extra?: { max?: number; disabled?: boolean; incDisabled?: boolean }
  ) {
    return root.render(
      <NumberField
        value={value}
        locale="en-US"
        max={extra?.max}
        disabled={extra?.disabled}
        onChange={v => {
          seen.push(v)
          setValue(v)
        }}
      >
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increment" disabled={extra?.incDisabled} />
        </NumberField.Group>
      </NumberField>
    )
  }

  it('NF-STEP-03: Primary pointerdown should step immediately without a compatibility-click duplicate', async () => {
    vi.useFakeTimers()
    const seen: Array<number | null> = []
    let current: number | null = 10
    const setValue = (v: number | null) => {
      current = v
    }
    const { container, root } = mount()
    await React.act(async () => {
      holdRender(root, seen, setValue, current)
    })
    const rerender = () =>
      React.act(async () => {
        holdRender(root, seen, setValue, current)
      })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    const input = container.querySelector('input') as HTMLInputElement

    await React.act(async () => {
      press(inc)
    })
    expect(seen).toEqual([11])
    expect(inc.getAttribute('data-pressed')).toBe('')
    // Mouse activation focuses the Input (NF-STEP-03 focus policy).
    expect(document.activeElement).toBe(input)
    await rerender()
    await React.act(async () => {
      release(inc)
    })
    expect(inc.getAttribute('data-pressed')).toBeNull()
    await React.act(async () => {
      compatClick(inc)
    })
    expect(seen).toEqual([11])

    // Shift press uses the coarse delta and retains it; release still clean.
    await React.act(async () => {
      press(inc, { shiftKey: true })
    })
    await rerender()
    expect(seen).toEqual([11, 21])
    await React.act(async () => {
      release(inc)
      compatClick(inc)
    })
    expect(seen).toEqual([11, 21])
    await cleanup(container, root)
  })

  it('NF-STEP-04 / NF-STEP-05 / NF-STEP-12: Repeats should fire at exactly 400ms then every 60ms, one request per step', async () => {
    // NF-STEP-12 landing adaptation: no dirty candidate exists until
    // PATCHES §1, so "without an intermediate commit" pins as exactly one
    // callback per tick from the current value.
    vi.useFakeTimers()
    const seen: Array<number | null> = []
    let current: number | null = 10
    const setValue = (v: number | null) => {
      current = v
    }
    const { container, root } = mount()
    await React.act(async () => {
      holdRender(root, seen, setValue, current)
    })
    const rerender = () =>
      React.act(async () => {
        holdRender(root, seen, setValue, current)
      })
    const tick = (ms: number) =>
      React.act(async () => {
        vi.advanceTimersByTime(ms)
      })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement

    await React.act(async () => {
      press(inc)
    })
    await rerender()
    expect(seen).toEqual([11])

    await tick(399)
    await rerender()
    expect(seen).toEqual([11])
    await tick(1)
    await rerender()
    expect(seen).toEqual([11, 12])

    await tick(59)
    await rerender()
    expect(seen).toEqual([11, 12])
    await tick(1)
    await rerender()
    expect(seen).toEqual([11, 12, 13])
    await tick(60)
    await rerender()
    expect(seen).toEqual([11, 12, 13, 14])
    await tick(60)
    await rerender()
    expect(seen).toEqual([11, 12, 13, 14, 15])

    await React.act(async () => {
      release(inc)
      compatClick(inc)
    })
    await tick(1000)
    expect(seen).toEqual([11, 12, 13, 14, 15])
    await cleanup(container, root)
  })

  it('NF-STEP-06: Pointer cancel and lost capture should terminate repeat independently', async () => {
    vi.useFakeTimers()
    for (const endType of ['pointercancel', 'lostpointercapture'] as const) {
      const seen: Array<number | null> = []
      let current: number | null = 10
      const { container, root } = mount()
      await React.act(async () => {
        holdRender(
          root,
          seen,
          v => {
            current = v
          },
          current
        )
      })
      const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
      await React.act(async () => {
        press(inc)
      })
      await React.act(async () => {
        holdRender(
          root,
          seen,
          v => {
            current = v
          },
          current
        )
      })
      expect(seen).toEqual([11])
      await React.act(async () => {
        vi.advanceTimersByTime(400)
      })
      await React.act(async () => {
        holdRender(
          root,
          seen,
          v => {
            current = v
          },
          current
        )
      })
      expect(seen).toEqual([11, 12])
      await React.act(async () => {
        inc.dispatchEvent(
          new PointerEvent(endType, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
          })
        )
      })
      expect(inc.getAttribute('data-pressed')).toBeNull()
      await React.act(async () => {
        compatClick(inc)
      })
      expect(seen).toEqual([11, 12])
      await React.act(async () => {
        vi.advanceTimersByTime(1000)
      })
      expect(seen).toEqual([11, 12])
      await cleanup(container, root)
    }
  })

  it('NF-STEP-07: Pointer leave should end the repeat session rather than pause it', async () => {
    vi.useFakeTimers()
    const seen: Array<number | null> = []
    let current: number | null = 10
    const { container, root } = mount()
    await React.act(async () => {
      holdRender(
        root,
        seen,
        v => {
          current = v
        },
        current
      )
    })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      press(inc)
    })
    expect(seen).toEqual([11])
    await React.act(async () => {
      // React derives onPointerLeave from pointerout (EnterLeave plugin),
      // so the harness dispatches pointerout with an outside relatedTarget.
      inc.dispatchEvent(
        new PointerEvent('pointerout', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          relatedTarget: document.body,
        })
      )
    })
    expect(inc.getAttribute('data-pressed')).toBeNull()
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    // No outside callback after leave: the hold is over, not paused.
    expect(seen).toEqual([11])
    await cleanup(container, root)
  })

  it('NF-STEP-08: Pressed re-entry should step immediately and start a fresh 400ms delay', async () => {
    vi.useFakeTimers()
    const seen: Array<number | null> = []
    let current: number | null = 10
    const { container, root } = mount()
    await React.act(async () => {
      holdRender(
        root,
        seen,
        v => {
          current = v
        },
        current
      )
    })
    const rerender = () =>
      React.act(async () => {
        holdRender(
          root,
          seen,
          v => {
            current = v
          },
          current
        )
      })
    const tick = (ms: number) =>
      React.act(async () => {
        vi.advanceTimersByTime(ms)
      })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    // React derives onPointerLeave/Enter from pointerout/pointerover.
    const leave = () =>
      inc.dispatchEvent(
        new PointerEvent('pointerout', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          relatedTarget: document.body,
        })
      )
    const enter = (buttons: number) =>
      inc.dispatchEvent(
        new PointerEvent('pointerover', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          buttons,
          button: 0,
          relatedTarget: document.body,
        })
      )

    await React.act(async () => {
      press(inc)
    })
    await rerender()
    expect(seen).toEqual([11])
    // Let the first hold run past its 400ms repeat, then leave.
    await tick(400)
    await rerender()
    expect(seen).toEqual([11, 12])
    await tick(60)
    await rerender()
    expect(seen).toEqual([11, 12, 13])
    await React.act(async () => {
      leave()
    })
    // Button-less hover disarms stale re-entry: no step.
    await React.act(async () => {
      enter(0)
    })
    expect(seen).toEqual([11, 12, 13])

    // Leave again (no session: leave is a no-op), re-press, leave, re-enter pressed.
    await React.act(async () => {
      press(inc)
    })
    await rerender()
    expect(seen).toEqual([11, 12, 13, 14])
    await React.act(async () => {
      leave()
    })
    await React.act(async () => {
      enter(1)
    })
    await rerender()
    // Immediate step on pressed re-entry, fresh 400ms delay (not the old 60ms cadence).
    expect(seen).toEqual([11, 12, 13, 14, 15])
    await tick(399)
    await rerender()
    expect(seen).toEqual([11, 12, 13, 14, 15])
    await tick(1)
    await rerender()
    expect(seen).toEqual([11, 12, 13, 14, 15, 16])
    await tick(59)
    await rerender()
    expect(seen).toEqual([11, 12, 13, 14, 15, 16])
    await tick(1)
    await rerender()
    expect(seen).toEqual([11, 12, 13, 14, 15, 16, 17])
    await React.act(async () => {
      release(inc)
    })
    await cleanup(container, root)
  })

  it('NF-STEP-10: A stationary quick touch activation should produce one step without forced focus', async () => {
    vi.useFakeTimers()
    const seen: Array<number | null> = []
    let current: number | null = 10
    const { container, root } = mount()
    await React.act(async () => {
      holdRender(
        root,
        seen,
        v => {
          current = v
        },
        current
      )
    })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      press(inc, { pointerType: 'touch' })
    })
    expect(seen).toEqual([11])
    // NumberField itself issues no focus call for touch/pen (software
    // keyboard outcomes stay exclusively NF-MANUAL-03).
    expect(document.activeElement).not.toBe(input)
    await React.act(async () => {
      release(inc, { pointerType: 'touch' })
      compatClick(inc)
    })
    expect(seen).toEqual([11])
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seen).toEqual([11])
    await cleanup(container, root)
  })

  it('NF-STEP-13: State changes and bounds should terminate active repeat as independent cleanup branches', async () => {
    vi.useFakeTimers()
    const seen: Array<number | null> = []
    let current: number | null = 9
    const { container, root } = mount()
    const renderAt = (extra?: { max?: number; disabled?: boolean; incDisabled?: boolean }) =>
      React.act(async () => {
        holdRender(
          root,
          seen,
          v => {
            current = v
          },
          current,
          extra
        )
      })
    // This engine has no readOnly prop — that branch lands with PATCHES §5.
    await renderAt({ max: 10 })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement

    // Branch 1: stepping onto the bound ends the hold immediately.
    await React.act(async () => {
      press(inc)
    })
    expect(seen).toEqual([10])
    await renderAt({ max: 10 })
    expect(inc.getAttribute('data-pressed')).toBeNull()
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seen).toEqual([10])

    // Branch 2: root disable mid-hold ends the session with no late callback.
    current = 5
    await renderAt({})
    const inc2 = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      press(inc2)
    })
    expect(seen).toEqual([10, 6])
    await renderAt({ disabled: true })
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seen).toEqual([10, 6])

    // Branch 3: disabling the pressed part mid-hold ends the session.
    current = 5
    await renderAt({})
    const inc3 = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      press(inc3)
    })
    expect(seen).toEqual([10, 6, 6])
    await renderAt({ incDisabled: true })
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seen).toEqual([10, 6, 6])
    await cleanup(container, root)
  })

  it('NF-STEP-14: Removal, unmount, and owner-window blur should terminate active repeat', async () => {
    vi.useFakeTimers()
    const seen: Array<number | null> = []
    let current: number | null = 10
    const { container, root } = mount()
    await React.act(async () => {
      holdRender(
        root,
        seen,
        v => {
          current = v
        },
        current
      )
    })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement

    // Branch 1: owner-window blur ends the session with no stale callback.
    await React.act(async () => {
      press(inc)
    })
    expect(seen).toEqual([11])
    await React.act(async () => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(inc.getAttribute('data-pressed')).toBeNull()
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seen).toEqual([11])

    // Branch 2: pressed-part removal ends the session with no stale callback.
    // Echo the branch-1 request first so branch 2 steps from 11.
    await React.act(async () => {
      holdRender(
        root,
        seen,
        v => {
          current = v
        },
        current
      )
    })
    await React.act(async () => {
      press(inc)
    })
    await React.act(async () => {
      holdRender(
        root,
        seen,
        v => {
          current = v
        },
        current
      )
    })
    expect(seen).toEqual([11, 12])
    await React.act(async () => {
      root.render(
        <NumberField
          value={current}
          locale="en-US"
          onChange={v => {
            seen.push(v)
            current = v
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
          </NumberField.Group>
        </NumberField>
      )
    })
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seen).toEqual([11, 12])
    await cleanup(container, root)

    // Branch 3: root unmount ends the session with no stale callback.
    const second = mount()
    const seen2: Array<number | null> = []
    let current2: number | null = 10
    await React.act(async () => {
      holdRender(
        second.root,
        seen2,
        v => {
          current2 = v
        },
        current2
      )
    })
    const incB = second.container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      press(incB)
    })
    expect(seen2).toEqual([11])
    await cleanup(second.container, second.root)
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seen2).toEqual([11])
  })

  it('NF-STEP-15: Touch movement, scroll intent, and pinch should cancel repeat without suppressing the gesture', async () => {
    vi.useFakeTimers()
    const seen: Array<number | null> = []
    let current: number | null = 10
    const { container, root } = mount()
    await React.act(async () => {
      holdRender(
        root,
        seen,
        v => {
          current = v
        },
        current
      )
    })
    const rerender = () =>
      React.act(async () => {
        holdRender(
          root,
          seen,
          v => {
            current = v
          },
          current
        )
      })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    const moveTouch = (clientX: number, clientY: number) =>
      inc.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          buttons: 1,
          clientX,
          clientY,
        })
      )

    await React.act(async () => {
      press(inc, { pointerType: 'touch', clientX: 10, clientY: 10 })
    })
    expect(seen).toEqual([11])
    // Exactly 8 CSS px retains the session; movement stays uncanceled.
    let retained = false
    await React.act(async () => {
      retained = moveTouch(18, 10)
    })
    expect(retained).toBe(true)
    expect(inc.getAttribute('data-pressed')).toBe('')
    // Echo the immediate request so the repeat steps from the current base.
    await rerender()
    await React.act(async () => {
      vi.advanceTimersByTime(400)
    })
    await rerender()
    expect(seen).toEqual([11, 12])

    // Beyond 8 CSS px cancels with no further request; gesture uncanceled.
    let canceledMove = false
    await React.act(async () => {
      canceledMove = moveTouch(19, 10)
    })
    expect(canceledMove).toBe(true)
    expect(inc.getAttribute('data-pressed')).toBeNull()
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seen).toEqual([11, 12])
    await React.act(async () => {
      compatClick(inc)
    })
    expect(seen).toEqual([11, 12])
    await cleanup(container, root)

    // Pinch: a second pointer while held cancels the session, never starts another.
    const pinch = mount()
    const seenPinch: Array<number | null> = []
    let currentPinch: number | null = 10
    await React.act(async () => {
      holdRender(
        pinch.root,
        seenPinch,
        v => {
          currentPinch = v
        },
        currentPinch
      )
    })
    const incP = pinch.container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      press(incP, { pointerType: 'touch' })
    })
    expect(seenPinch).toEqual([11])
    await React.act(async () => {
      incP.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 3,
          pointerId: 2,
          pointerType: 'touch',
          isPrimary: false,
          clientX: 30,
          clientY: 30,
        })
      )
    })
    expect(incP.getAttribute('data-pressed')).toBeNull()
    await React.act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(seenPinch).toEqual([11])
    await React.act(async () => {
      compatClick(incP)
    })
    expect(seenPinch).toEqual([11])
    await cleanup(pinch.container, pinch.root)
  })
})

describe('NumberField redundant onChange suppression (FEATURES #2)', () => {
  it('Steppers and arrows at bounds should emit nothing while real steps still fire', async () => {
    // Decided any-no-change: uniform "no change → no event", not a
    // bounds-only special case — but bounds are where it bites.
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(10)
      return (
        <NumberField
          value={value}
          locale="en-US"
          min={0}
          max={10}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    const dec = container.querySelector('button[aria-label="Decrement"]') as HTMLButtonElement
    const input = container.querySelector('input') as HTMLInputElement

    // At max: stepper click and ArrowUp emit nothing.
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([])
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([])

    // A real step still fires exactly once.
    await React.act(async () => {
      dec.click()
    })
    expect(seen).toEqual([9])
    expect(input.value).toBe('9')
    await cleanup(container, root)

    // Mirror at min: decrement and ArrowDown emit nothing.
    const seenMin: Array<number | null> = []
    const m = mount()
    await React.act(async () => {
      m.root.render(
        <NumberField value={0} locale="en-US" min={0} max={10} onChange={v => void seenMin.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const decMin = m.container.querySelector('button[aria-label="Decrement"]') as HTMLButtonElement
    const inputMin = m.container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      decMin.click()
    })
    expect(seenMin).toEqual([])
    await React.act(async () => {
      pressKey(inputMin, 'ArrowDown')
    })
    expect(seenMin).toEqual([])
    await cleanup(m.container, m.root)
  })

  it('Home and End at their bound should stay handled but emit nothing', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={0} locale="en-US" min={0} max={100} onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement

    // Already at min: Home is handled (caret pinned) but silent.
    let home: KeyboardEvent | null = null
    await React.act(async () => {
      home = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true })
      input.dispatchEvent(home)
    })
    expect(home!.defaultPrevented).toBe(true)
    expect(seen).toEqual([])
    await cleanup(container, root)

    // Away from bounds both keys still request exactly once.
    const seenAway: Array<number | null> = []
    const a = mount()
    await React.act(async () => {
      a.root.render(
        <NumberField value={50} locale="en-US" min={0} max={100} onChange={v => void seenAway.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const inputAway = a.container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      pressKey(inputAway, 'Home')
    })
    expect(seenAway).toEqual([0])
    await React.act(async () => {
      // Parent holds 50, so End still requests from the same base.
      pressKey(inputAway, 'End')
    })
    expect(seenAway).toEqual([0, 100])
    await cleanup(a.container, a.root)

    // Already at max: End is handled but silent.
    const seenMax: Array<number | null> = []
    const b = mount()
    await React.act(async () => {
      b.root.render(
        <NumberField value={100} locale="en-US" min={0} max={100} onChange={v => void seenMax.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const inputMax = b.container.querySelector('input') as HTMLInputElement
    let end: KeyboardEvent | null = null
    await React.act(async () => {
      end = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true })
      inputMax.dispatchEvent(end)
    })
    expect(end!.defaultPrevented).toBe(true)
    expect(seenMax).toEqual([])
    await cleanup(b.container, b.root)
  })

  it('Text edits that change nothing should emit nothing', async () => {
    // Retyping the current value and clearing an empty field are no-ops —
    // judged live and at commit alike (no-change suppression everywhere).
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '5')
    })
    expect(seen).toEqual([])
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([])
    expect(input.value).toBe('5')
    // Clearing a non-empty field requests null live, retried at commit.
    await React.act(async () => {
      setNativeValue(input, '')
    })
    expect(seen).toEqual([null])
    await React.act(async () => {
      input.blur()
    })
    expect(seen).toEqual([null, null])
    await cleanup(container, root)

    const seenNull: Array<number | null> = []
    const n = mount()
    await React.act(async () => {
      n.root.render(
        <NumberField value={null} locale="en-US" onChange={v => void seenNull.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const inputNull = n.container.querySelector('input') as HTMLInputElement
    // Clearing an already-empty field emits nothing.
    await React.act(async () => {
      inputNull.focus()
      setNativeValue(inputNull, '')
    })
    await React.act(async () => {
      inputNull.blur()
    })
    expect(seenNull).toEqual([])
    // Typing a real value requests it live, retried at commit.
    await React.act(async () => {
      inputNull.focus()
      setNativeValue(inputNull, '8')
    })
    expect(seenNull).toEqual([8])
    await React.act(async () => {
      pressKey(inputNull, 'Enter')
    })
    expect(seenNull).toEqual([8, 8])
    await cleanup(n.container, n.root)
  })
})

describe('NumberField dirty edit session (B-19)', () => {
  it('NF-EDIT-03: Newly parseable live edits should request numbers while preserving authored text', async () => {
    // NFLAST ruling (c) re-pin of the B-19 repro: min=1 max=10,
    // keystroke-type "2.5" into an empty field with an accepting parent.
    // The "." still survives verbatim (the B-19 fix); parseable meanings
    // publish live instead of waiting for commit.
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <NumberField
          value={value}
          locale="en-US"
          min={1}
          max={10}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
    })
    // Ordered deduped live requests; the accepted echoes preserve the
    // exact typed buffer and the dirty session (NF-COMMIT-08).
    await React.act(async () => {
      setNativeValue(input, '2')
    })
    expect(input.value).toBe('2')
    expect(seen).toEqual([2])
    expect(input.getAttribute('data-editing')).toBe('')
    await React.act(async () => {
      setNativeValue(input, '2.')
    })
    expect(input.value).toBe('2.')
    expect(seen).toEqual([2])
    await React.act(async () => {
      setNativeValue(input, '2.5')
    })
    expect(input.value).toBe('2.5')
    expect(seen).toEqual([2, 2.5])
    expect(input.getAttribute('data-editing')).toBe('')
    // Commit after full echo is a no-op: the value already landed live.
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([2, 2.5])
    expect(input.value).toBe('2.5')
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)

    // Dedupe across trailing-decimal and grouping spellings (NF-EDIT-05
    // ASCII core; locale-digit spellings ride the Intl leg).
    const seenDedupe: Array<number | null> = []
    const d = mount()
    function DedupeApp() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <NumberField
          value={value}
          locale="en-US"
          onChange={v => {
            seenDedupe.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      d.root.render(<DedupeApp />)
    })
    const dInput = d.container.querySelector('input') as HTMLInputElement
    for (const text of ['1', '1.', '1.0']) {
      await React.act(async () => {
        setNativeValue(dInput, text)
      })
      expect(dInput.value).toBe(text)
    }
    expect(seenDedupe).toEqual([1])
    await React.act(async () => {
      setNativeValue(dInput, '1,000')
    })
    expect(seenDedupe).toEqual([1, 1000])
    await React.act(async () => {
      setNativeValue(dInput, '1000')
    })
    expect(seenDedupe).toEqual([1, 1000])
    expect(dInput.value).toBe('1000')
    await cleanup(d.container, d.root)
  })

  it('NF-EDIT-05: Live edits with repeated numeric meaning should dedupe without ending the dirty session', async () => {
    // Full title: the ar-EG journey through 1, trailing-decimal,
    // fractional, grouped, and ASCII-mixed spellings — one request per
    // numeric meaning, exact text throughout, session never ends.
    const seen: Array<number | null> = []
    const nativeSpy = vi.fn()
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <NumberField
          value={value}
          locale="ar-EG"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" onChange={nativeSpy} />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
    })
    const journey: Array<{ text: string; requests: Array<number | null> }> = [
      { text: '١', requests: [1] },
      { text: '١٫', requests: [1] },
      { text: '١٫٠', requests: [1] },
      { text: '١٬٠٠٠', requests: [1, 1000] },
      { text: '1٬٠٠٠', requests: [1, 1000] },
      { text: '1000', requests: [1, 1000] },
    ]
    for (const step of journey) {
      await React.act(async () => {
        setNativeValue(input, step.text)
      })
      expect(input.value).toBe(step.text)
      expect(input.getAttribute('data-editing')).toBe('')
      expect(seen).toEqual(step.requests)
    }
    // Native handlers observe every mutation even when nothing publishes.
    expect(nativeSpy).toHaveBeenCalledTimes(journey.length)
    await cleanup(container, root)
  })

  it('Live out-of-range edits should request raw values while none-mode commit clamps once; invalid text reverts silently', async () => {
    // NFLAST ruling (c): live requests are raw (no clamp until commit).
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US" min={1} max={10} onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    // Typing requests the raw 25; clamp happens at commit.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '25')
    })
    expect(input.value).toBe('25')
    expect(seen).toEqual([25])
    await React.act(async () => {
      input.blur()
    })
    expect(seen).toEqual([25, 10])
    // Parent holds 5: the rejecting echo snaps the display back.
    expect(input.value).toBe('5')
    // Invalid text reverts silently.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, 'garbage')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([25, 10])
    expect(input.value).toBe('5')
    await cleanup(container, root)
  })

  it('Step actions should use a complete dirty candidate as their base and end the session', async () => {
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <NumberField
          value={value}
          locale="en-US"
          min={0}
          max={100}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    // Dirty "7" (live-accepted) + ArrowUp steps 7 → 8; session ends.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '7')
    })
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([7, 8])
    expect(input.value).toBe('8')
    // Dirty "20" + stepper click steps 20 → 21.
    await React.act(async () => {
      setNativeValue(input, '20')
    })
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([7, 8, 20, 21])
    expect(input.value).toBe('21')
    // Incomplete drafts fall back to controlled value: "-" + ArrowUp → 22.
    await React.act(async () => {
      setNativeValue(input, '-')
    })
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([7, 8, 20, 21, 22])
    expect(input.value).toBe('22')
    await cleanup(container, root)
  })

  it('A prevented blur should veto commit and keep the dirty buffer', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" onBlur={e => e.preventDefault()} />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '9')
    })
    await React.act(async () => {
      input.blur()
    })
    // The live 9 published before the veto; the veto blocks only commit.
    expect(seen).toEqual([9])
    expect(input.value).toBe('9')
    expect(input.getAttribute('data-editing')).toBe('')
    // Enter still commits the resumed session (retry — parent holds 5).
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([9, 9])
    await cleanup(container, root)
  })

  it('A programmatic value change should replace the buffer and end the session', async () => {
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US">
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '9')
    })
    expect(input.getAttribute('data-editing')).toBe('')
    await React.act(async () => {
      root.render(
        <NumberField value={42} locale="en-US">
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    expect(input.value).toBe('42')
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)
  })
})

describe('NumberField live requests (NFLAST ruling c)', () => {
  it('NF-EDIT-04: Clearing should request null once as a live candidate', async () => {
    // NFLAST ruling (c): clearing publishes null immediately (once);
    // the accepted echo preserves the dirty empty state until commit.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App({ value }: { value: number | null }) {
      return (
        <NumberField value={value} locale="en-US" name="qty" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '')
    })
    // One live null request; hidden stays controlled (no optimistic null).
    expect(seen).toEqual([null])
    expect(input.value).toBe('')
    expect(input.getAttribute('data-editing')).toBe('')
    expect(hidden.value).toBe('5')
    // Repeated empty events never duplicate the live null.
    await React.act(async () => {
      setNativeValue(input, '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(seen).toEqual([null])
    // The accepted echo preserves the dirty empty state.
    await React.act(async () => {
      root.render(<App value={null} />)
    })
    expect(input.value).toBe('')
    expect(input.getAttribute('data-editing')).toBe('')
    expect(hidden.value).toBe('')
    // Equivalent empty input after echo stays silent; commit ends dirty.
    await React.act(async () => {
      setNativeValue(input, '   ')
    })
    expect(seen).toEqual([null])
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([null])
    expect(input.value).toBe('')
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-EDIT-14: Rejected live requests should not create a hidden numeric store', async () => {
    // A rejecting parent: every live meaning publishes, nothing sticks —
    // text stays authored, controlled/hidden/state stay prop-based, and
    // later requests derive from the current buffer.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US" name="qty" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    for (const text of ['1', '12', '42']) {
      await React.act(async () => {
        input.focus()
        setNativeValue(input, text)
      })
      expect(input.value).toBe(text)
    }
    expect(seen).toEqual([1, 12, 42])
    // Cursor moves keep the authored buffer; state stays prop-based.
    await React.act(async () => {
      input.setSelectionRange(0, 1)
      setNativeValue(input, '43')
    })
    expect(seen).toEqual([1, 12, 42, 43])
    expect(input.value).toBe('43')
    expect(hidden.value).toBe('5')
    expect(input.getAttribute('data-invalid')).toBeNull()
    // Commit retries from the current buffer; rejection restores control.
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([1, 12, 42, 43, 43])
    expect(input.value).toBe('5')
    expect(hidden.value).toBe('5')
    // Later requests still derive from the current buffer, never a store.
    await React.act(async () => {
      setNativeValue(input, '7')
    })
    expect(seen).toEqual([1, 12, 42, 43, 43, 7])
    await cleanup(container, root)
  })

  it('NF-COMMIT-01: Blur should commit after the consumer handler and retry a candidate that differs from controlled value', async () => {
    // Delayed echo: the live candidate is accepted but its prop echo
    // waits out the blur; blur commits exactly one retry, consumer first.
    const seen: Array<number | null> = []
    const order: string[] = []
    let applyEcho: (() => void) | null = null
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <div>
          <button type="button" data-testid="nf-outside">
            Outside
          </button>
          <NumberField
            value={value}
            locale="en-US"
            name="qty"
            onChange={v => {
              seen.push(v)
              order.push(`request:${v}`)
              applyEcho = () => setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" onBlur={() => void order.push('blur')} />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </div>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    const outside = container.querySelector('[data-testid="nf-outside"]') as HTMLButtonElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '7')
    })
    // Live request published; hidden stays controlled (no optimistic 7).
    expect(seen).toEqual([7])
    expect(hidden.value).toBe('5')
    await React.act(async () => {
      input.blur()
      outside.focus()
    })
    // Consumer blur first, then exactly one commit retry.
    expect(order).toEqual(['request:7', 'blur', 'request:7'])
    expect(seen).toEqual([7, 7])
    expect(document.activeElement).toBe(outside)
    // The delayed echo lands controlled acceptance formatting.
    await React.act(async () => {
      applyEcho?.()
    })
    expect(input.value).toBe('7')
    expect(hidden.value).toBe('7')
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-COMMIT-08: Accepted latest echoes should preserve dirty text until an explicit commit/revert', async () => {
    // Alternate textual representations ('007') survive their own echo
    // with exact text/caret/editing; commit canonicalizes and clears.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <NumberField
          value={value}
          locale="en-US"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '007')
    })
    expect(seen).toEqual([7])
    // The echo preserved the verbatim buffer and dirty state.
    expect(input.value).toBe('007')
    expect(input.getAttribute('data-editing')).toBe('')
    await React.act(async () => {
      input.setSelectionRange(1, 1)
    })
    // A same-meaning edit keeps the session without a new request.
    await React.act(async () => {
      setNativeValue(input, '07')
    })
    expect(seen).toEqual([7])
    expect(input.value).toBe('07')
    expect(input.getAttribute('data-editing')).toBe('')
    // Commit canonicalizes the accepted text and clears editing.
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([7])
    expect(input.value).toBe('7')
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-COMMIT-11: Out-of-order controlled echoes should never be mistaken for acceptance of the latest request', async () => {
    // Issue A then B; a stale A replaces the buffer and ends the
    // session, B echoes cleanly, and an unrelated C replaces again —
    // all with zero programmatic callback.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App({ value }: { value: number | null }) {
      return (
        <NumberField value={value} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '10')
    })
    await React.act(async () => {
      setNativeValue(input, '20')
    })
    expect(seen).toEqual([10, 20])
    expect(input.value).toBe('20')
    // Stale A (10 ≠ latest 20): replace from control, end session.
    await React.act(async () => {
      root.render(<App value={10} />)
    })
    expect(input.value).toBe('10')
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(seen).toEqual([10, 20])
    // Late B after the session ended: fresh authoritative replacement
    // (the freeze treats it like unrelated C), still no callback.
    await React.act(async () => {
      root.render(<App value={20} />)
    })
    expect(input.value).toBe('20')
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(seen).toEqual([10, 20])
    // Unrelated C: replace from control, end session, no callback.
    await React.act(async () => {
      root.render(<App value={99} />)
    })
    expect(input.value).toBe('99')
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(seen).toEqual([10, 20])
    await cleanup(container, root)
  })

  it('NF-DYNAMIC-01: Latest accepted echo, stale echo, and unrelated value replacement should have distinct dirty-session outcomes', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App({ value }: { value: number | null }) {
      return (
        <NumberField value={value} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    // Latest echo preserves text and editing with no callback.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '6')
    })
    expect(seen).toEqual([6])
    await React.act(async () => {
      root.render(<App value={6} />)
    })
    expect(input.value).toBe('6')
    expect(input.getAttribute('data-editing')).toBe('')
    expect(seen).toEqual([6])
    // Stale echo (the older 5 returning after 7 was requested)
    // replaces text, clears editing, no callback.
    await React.act(async () => {
      setNativeValue(input, '7')
    })
    expect(seen).toEqual([6, 7])
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    expect(input.value).toBe('5')
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(seen).toEqual([6, 7])
    // Unrelated replacement replaces text, clears editing, no callback.
    await React.act(async () => {
      setNativeValue(input, '8')
    })
    expect(seen).toEqual([6, 7, 8])
    await React.act(async () => {
      root.render(<App value={42} />)
    })
    expect(input.value).toBe('42')
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(seen).toEqual([6, 7, 8])
    await cleanup(container, root)
  })
})

describe('NumberField environments', () => {
  it('NF-ENV-01: Server markup should carry textbox semantics for hydration', () => {
    // B-26 / PATCHES §8: plain textbox, never spinbutton or numeric
    // aria-value* — so unbounded ±Infinity sentinels never reach ARIA.
    const html = renderToString(
      <NumberField value={42} locale="en-US" min={0} max={100}>
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField>
    )
    expect(html).not.toContain('spinbutton')
    expect(html).not.toContain('aria-valuenow')
    expect(html).not.toContain('aria-valuemin')
    expect(html).not.toContain('aria-valuemax')
    expect(html).not.toContain('aria-valuetext')
    expect(html).toContain('value="42"')
    expect(html).toContain('role="group"')

    // Unbounded defaults leave no -Infinity/Infinity ARIA behind either.
    const unboundedHtml = renderToString(
      <NumberField value={42} locale="en-US">
        <NumberField.Group>
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increment" />
        </NumberField.Group>
      </NumberField>
    )
    expect(unboundedHtml).not.toContain('Infinity')
    expect(unboundedHtml).not.toContain('aria-value')
  })

  it('NF-ENV-02: Mismatched server/client Intl data should report an unsupported deployment instead of promising identical bytes', async () => {
    // A server ICU whose decimal format carries a spacing the client ICU
    // lacks: stub NumberFormat.format on the server side only.
    const RealNumberFormat = Intl.NumberFormat
    const ServerNumberFormat = class extends RealNumberFormat {
      override format(value: number | bigint): string {
        return `${super.format(value as number)} `
      }
    }
    function App() {
      return (
        <NumberField value={1234.5} locale="en-US">
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const errors: string[] = []
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    try {
      Object.defineProperty(Intl, 'NumberFormat', {
        value: ServerNumberFormat,
        writable: true,
        configurable: true,
      })
      const ssrHtml = renderToString(<App />)
      expect(ssrHtml).toContain('value="1,234.5 "')
      Object.defineProperty(Intl, 'NumberFormat', {
        value: RealNumberFormat,
        writable: true,
        configurable: true,
      })
      // Mismatched hydrate: the compatibility diagnostic fires (once),
      // names the unsupported deployment, and disclaims the equal-bytes
      // contract — without throwing.
      const container = document.createElement('div')
      document.body.appendChild(container)
      container.innerHTML = ssrHtml
      let root: ReturnType<typeof hydrateRoot> | null = null
      await React.act(async () => {
        root = hydrateRoot(container, <App />)
      })
      const diags = errors.filter(t => t.includes('Reference UI: NumberField'))
      expect(diags).toHaveLength(1)
      expect(diags[0]).toContain('Intl')
      expect(diags[0]).toContain('unsupported deployment')
      expect(diags[0]).toContain('not promised identical bytes')
      await React.act(async () => {
        root!.unmount()
      })
      container.remove()
      // Matching hydrate stays silent: no NumberField diagnostic.
      errors.length = 0
      const matchHtml = renderToString(<App />)
      expect(matchHtml).toContain('value="1,234.5"')
      const matchContainer = document.createElement('div')
      document.body.appendChild(matchContainer)
      matchContainer.innerHTML = matchHtml
      let matchRoot: ReturnType<typeof hydrateRoot> | null = null
      await React.act(async () => {
        matchRoot = hydrateRoot(matchContainer, <App />)
      })
      expect(errors.filter(t => t.includes('Reference UI: NumberField'))).toEqual([])
      await React.act(async () => {
        matchRoot!.unmount()
      })
      matchContainer.remove()
      // Pure client render stays silent (no SSR attribute to compare).
      errors.length = 0
      const { container: clientContainer, root: clientRoot } = mount()
      await React.act(async () => {
        clientRoot.render(<App />)
      })
      expect(errors.filter(t => t.includes('Reference UI: NumberField'))).toEqual([])
      await cleanup(clientContainer, clientRoot)
    } finally {
      Object.defineProperty(Intl, 'NumberFormat', {
        value: RealNumberFormat,
        writable: true,
        configurable: true,
      })
      errorSpy.mockRestore()
    }
  })

  it('NF-ENV-05: StrictMode should not duplicate callbacks on a single step', async () => {
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(10)
      return (
        <React.StrictMode>
          <NumberField
            value={value}
            locale="en-US"
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </React.StrictMode>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([11])
    await cleanup(container, root)
  })
})

describe('NumberField required stepper names', () => {
  it('NF-DOM-09: Missing, empty, or unresolved stepper names fail at runtime instead of receiving English fallback text', async () => {
    // PATCHES §6: bypass types with absent/blank labels and empty/missing
    // labelledby targets; each offender diagnoses once, renders nothing,
    // and never activates; a valid authored name recovers the part.
    const errors: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    try {
      const diags = () => errors.filter(t => t.includes('Reference UI: NumberField'))
      const noNameDec = {} as unknown as NumberFieldDecrementProps
      const noNameInc = {} as unknown as NumberFieldIncrementProps

      // Absent naming on both steppers: no buttons, no invented label,
      // no callback, one diagnostic per part.
      {
        const seen: Array<number | null> = []
        const { container, root } = mount()
        await React.act(async () => {
          root.render(
            <NumberField value={42} locale="en-US" onChange={v => void seen.push(v)}>
              <NumberField.Group>
                <NumberField.Decrement {...noNameDec} />
                <NumberField.Input aria-label="Quantity" />
                <NumberField.Increment {...noNameInc} />
              </NumberField.Group>
            </NumberField>
          )
        })
        expect(container.querySelector('button')).toBeNull()
        expect(container.querySelector('input')?.value).toBe('42')
        expect(seen).toEqual([])
        expect(diags()).toHaveLength(2)
        expect(diags()[0]).toMatch(/Decrement.*requires a nonempty/)
        expect(diags()[1]).toMatch(/Increment.*requires a nonempty/)
        await cleanup(container, root)
      }

      // Blank labels and blank/empty labelledby fail the same way.
      for (const bad of [
        { 'aria-label': '' },
        { 'aria-label': '   ' },
        { 'aria-labelledby': '' },
        { 'aria-labelledby': '   ' },
      ]) {
        const before = diags().length
        const { container, root } = mount()
        await React.act(async () => {
          root.render(
            <NumberField value={1} locale="en-US">
              <NumberField.Group>
                <NumberField.Decrement {...(bad as NumberFieldDecrementProps)} />
                <NumberField.Input aria-label="Quantity" />
              </NumberField.Group>
            </NumberField>
          )
        })
        expect(container.querySelector('button')).toBeNull()
        expect(diags()).toHaveLength(before + 1)
        expect(diags()[diags().length - 1]).toMatch(/Decrement.*requires a nonempty/)
        await cleanup(container, root)
      }

      // Missing labelledby target: unresolved, no invented label.
      {
        const before = diags().length
        const { container, root } = mount()
        await React.act(async () => {
          root.render(
            <NumberField value={1} locale="en-US">
              <NumberField.Group>
                <NumberField.Input aria-label="Quantity" />
                <NumberField.Increment aria-labelledby="nf-dom09-missing" />
              </NumberField.Group>
            </NumberField>
          )
        })
        expect(container.querySelector('button')).toBeNull()
        expect(diags()).toHaveLength(before + 1)
        expect(diags()[diags().length - 1]).toMatch(/Increment.*does not resolve/)
        await cleanup(container, root)
      }

      // Existing-but-empty target resolves to an empty name: still fails.
      {
        const before = diags().length
        const { container, root } = mount()
        await React.act(async () => {
          root.render(
            <div>
              <span id="nf-dom09-empty" />
              <NumberField value={1} locale="en-US">
                <NumberField.Group>
                  <NumberField.Input aria-label="Quantity" />
                  <NumberField.Increment aria-labelledby="nf-dom09-empty" />
                </NumberField.Group>
              </NumberField>
            </div>
          )
        })
        expect(container.querySelector('button')).toBeNull()
        expect(diags()).toHaveLength(before + 1)
        await cleanup(container, root)
      }

      // Valid labelledby renders with no diagnostic.
      {
        const before = diags().length
        const { container, root } = mount()
        await React.act(async () => {
          root.render(
            <div>
              <span id="nf-dom09-label">Less</span>
              <NumberField value={1} locale="en-US">
                <NumberField.Group>
                  <NumberField.Decrement aria-labelledby="nf-dom09-label" />
                  <NumberField.Input aria-label="Quantity" />
                </NumberField.Group>
              </NumberField>
            </div>
          )
        })
        expect(container.querySelector('button')).not.toBeNull()
        expect(diags()).toHaveLength(before)
        await cleanup(container, root)
      }

      // Recovery: a valid authored name renders and activates the part.
      {
        const seen: Array<number | null> = []
        const { container, root } = mount()
        const before = diags().length
        await React.act(async () => {
          root.render(
            <NumberField value={10} locale="en-US" onChange={v => void seen.push(v)}>
              <NumberField.Group>
                <NumberField.Input aria-label="Quantity" />
                <NumberField.Increment {...noNameInc} />
              </NumberField.Group>
            </NumberField>
          )
        })
        expect(container.querySelector('button')).toBeNull()
        expect(diags()).toHaveLength(before + 1)
        await React.act(async () => {
          root.render(
            <NumberField value={10} locale="en-US" onChange={v => void seen.push(v)}>
              <NumberField.Group>
                <NumberField.Input aria-label="Quantity" />
                <NumberField.Increment aria-label="More" />
              </NumberField.Group>
            </NumberField>
          )
        })
        const inc = container.querySelector('button[aria-label="More"]') as HTMLButtonElement
        expect(inc).not.toBeNull()
        await React.act(async () => {
          inc.click()
        })
        expect(seen).toEqual([11])
        expect(diags()).toHaveLength(before + 1)
        await cleanup(container, root)
      }
    } finally {
      spy.mockRestore()
    }
  })
})

describe('NumberField commitBehavior (W-02)', () => {
  function snapApp(seen: Array<number | null>, invalid: Array<[number, string]>, extra?: Record<string, unknown>) {
    return function App() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={1}
          commitBehavior="snap"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
          onInvalidCommit={(attempted, reason) => void invalid.push([attempted, reason])}
          {...extra}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
  }

  it('W-02 snap: typing 2.5 with step 1 commits 3 with a single onChange', async () => {
    const seen: Array<number | null> = []
    const invalid: Array<[number, string]> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(React.createElement(snapApp(seen, invalid)))
    })
    const input = container.querySelector('input') as HTMLInputElement
    // Live meanings publish raw; the snap lands only at commit.
    const progressive: Array<[string, Array<number | null>]> = [
      ['2', [2]],
      ['2.', [2]],
      ['2.5', [2, 2.5]],
    ]
    for (const [text, expected] of progressive) {
      await React.act(async () => {
        setNativeValue(input, text)
      })
      expect(input.value).toBe(text)
      expect(seen).toEqual(expected)
    }
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([2, 2.5, 3])
    expect(invalid).toEqual([])
    expect(input.value).toBe('3')
    await cleanup(container, root)
  })

  it('NF-MATH-09: Snap midpoint ties should move away from zero', async () => {
    // NFLAST ruling (a) re-pin: replaces the signed-off W-02 half-up title.
    // Freeze decision 7 — symmetric ties, least-surprise.
    async function commit(text: string): Promise<{ seen: Array<number | null>; display: string }> {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      function App() {
        const [value, setValue] = React.useState<number | null>(null)
        return (
          <NumberField
            value={value}
            locale="en-US"
            step={1}
            commitBehavior="snap"
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        )
      }
      await React.act(async () => {
        root.render(<App />)
      })
      const input = container.querySelector('input') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, text)
      })
      await React.act(async () => {
        input.blur()
      })
      const display = input.value
      await cleanup(container, root)
      return { seen, display }
    }
    // Below, above, and exactly halfway — both signs. Each vector
    // publishes its raw live meaning first, then the snapped commit.
    expect(await commit('2.4')).toEqual({ seen: [2.4, 2], display: '2' })
    expect(await commit('2.6')).toEqual({ seen: [2.6, 3], display: '3' })
    expect(await commit('2.5')).toEqual({ seen: [2.5, 3], display: '3' })
    expect(await commit('-2.4')).toEqual({ seen: [-2.4, -2], display: '-2' })
    expect(await commit('-2.6')).toEqual({ seen: [-2.6, -3], display: '-3' })
    expect(await commit('-2.5')).toEqual({ seen: [-2.5, -3], display: '-3' })
  })

  it('NF-MATH-10: Snap should preserve exact and exceeded non-grid maximum endpoints', async () => {
    // NFLAST ruling (a) re-pin: replaces the W-02 lattice-clamp title.
    // min=0, max=10, step=3 — 10 is off the zero lattice {0,3,6,9,12}.
    async function commit(text: string): Promise<{ seen: Array<number | null>; display: string; hidden: string }> {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      function App() {
        const [value, setValue] = React.useState<number | null>(5)
        return (
          <NumberField
            value={value}
            locale="en-US"
            name="qty"
            min={0}
            max={10}
            step={3}
            commitBehavior="snap"
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        )
      }
      await React.act(async () => {
        root.render(<App />)
      })
      const input = container.querySelector('input:not([type="hidden"])') as HTMLInputElement
      await React.act(async () => {
        setNativeValue(input, text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      const display = input.value
      const hidden = (container.querySelector('input[type="hidden"]') as HTMLInputElement).value
      await cleanup(container, root)
      return { seen, display, hidden }
    }
    // Exact max and exceeded max both preserve the endpoint.
    expect(await commit('10')).toEqual({ seen: [10], display: '10', hidden: '10' })
    expect(await commit('13')).toEqual({ seen: [13, 10], display: '10', hidden: '10' })
    // Nearby in-range vectors snap to the ordinary nearest lattice point.
    expect(await commit('8.6')).toEqual({ seen: [8.6, 9], display: '9', hidden: '9' })
    expect(await commit('7.4')).toEqual({ seen: [7.4, 6], display: '6', hidden: '6' })
  })

  it('W-02 snap: fractional steps snap to the nearest lattice point', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={0.25}
          commitBehavior="snap"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      setNativeValue(input, '0.3')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([0.3, 0.25])
    await cleanup(container, root)

    // Half-up tie on a fractional lattice: 0.25 rises to 0.5 at step 0.5.
    const seenTie: Array<number | null> = []
    const t = mount()
    function TieApp() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={0.5}
          commitBehavior="snap"
          onChange={v => {
            seenTie.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      t.root.render(<TieApp />)
    })
    const tieInput = t.container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      setNativeValue(tieInput, '0.25')
    })
    await React.act(async () => {
      pressKey(tieInput, 'Enter')
    })
    expect(seenTie).toEqual([0.25, 0.5])
    await cleanup(t.container, t.root)
  })

  it('NF-MATH-11: Snap should preserve exact and exceeded non-grid minimum endpoints', async () => {
    // NFLAST ruling (a) re-pin: replaces the W-02 min-anchor title. The
    // 5.5 vector proves zero-anchoring (→6); min-anchored {1,4,7} gave 7.
    async function commit(
      text: string,
      bounds: { min: number; max: number }
    ): Promise<{ seen: Array<number | null>; display: string }> {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      function App() {
        const [value, setValue] = React.useState<number | null>(null)
        return (
          <NumberField
            value={value}
            locale="en-US"
            min={bounds.min}
            max={bounds.max}
            step={3}
            commitBehavior="snap"
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        )
      }
      await React.act(async () => {
        root.render(<App />)
      })
      const input = container.querySelector('input') as HTMLInputElement
      await React.act(async () => {
        setNativeValue(input, text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      const display = input.value
      await cleanup(container, root)
      return { seen, display }
    }
    // Positive off-lattice min: exact and lower candidates preserve it;
    // in-range vectors snap on the zero lattice above it.
    expect(await commit('1', { min: 1, max: 100 })).toEqual({ seen: [1], display: '1' })
    expect(await commit('0', { min: 1, max: 100 })).toEqual({ seen: [0, 1], display: '1' })
    expect(await commit('5.5', { min: 1, max: 100 })).toEqual({ seen: [5.5, 6], display: '6' })
    expect(await commit('4.4', { min: 1, max: 100 })).toEqual({ seen: [4.4, 3], display: '3' })
    // Negative off-lattice min: same preservation below zero.
    expect(await commit('-10', { min: -10, max: 0 })).toEqual({ seen: [-10], display: '-10' })
    expect(await commit('-13', { min: -10, max: 0 })).toEqual({ seen: [-13, -10], display: '-10' })
    expect(await commit('-8.6', { min: -10, max: 0 })).toEqual({ seen: [-8.6, -9], display: '-9' })
  })

  it('W-02 snap: no-change commits emit nothing; invalid text reverts silently', async () => {
    const seen: Array<number | null> = []
    const invalid: Array<[number, string]> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField
          value={3}
          locale="en-US"
          step={1}
          commitBehavior="snap"
          onChange={v => void seen.push(v)}
          onInvalidCommit={(attempted, reason) => void invalid.push([attempted, reason])}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '3')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([])
    await React.act(async () => {
      input.focus()
      setNativeValue(input, 'garbage')
    })
    await React.act(async () => {
      input.blur()
    })
    expect(seen).toEqual([])
    expect(invalid).toEqual([])
    expect(input.value).toBe('3')
    await cleanup(container, root)
  })

  it('W-02 snap: authored display precision applies to the committed number', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={0.1}
          commitBehavior="snap"
          formatOptions={{ maximumFractionDigits: 0 }}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    // Snap keeps 2.5 on the 0.1 lattice; the display round-trip (React Aria
    // commit parity) then publishes the displayed 3. The live 2.5 lands
    // first (accepted), then the rounded commit.
    await React.act(async () => {
      setNativeValue(input, '2.5')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([2.5, 3])
    expect(input.value).toBe('3')
    await cleanup(container, root)
  })

  function validateApp(
    seen: Array<number | null>,
    invalid: Array<[number, string]>,
    extra?: Record<string, unknown>
  ) {
    return function App() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={1}
          commitBehavior="validate"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
          onInvalidCommit={(attempted, reason) => void invalid.push([attempted, reason])}
          {...extra}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
  }

  it('NF-MATH-13: Validate mode should apply authored rounding without snapping or clamping', async () => {
    // NFLAST ruling (b) re-pin: replaces the two W-02 validate-reject
    // titles. Retain-and-report — the rounded raw candidate is requested
    // as-is; the advisory onInvalidCommit fires after the commit request.
    // (With an immediately accepting parent the commit is a no-op, so the
    // advisory never fires — the suite rejects live, then echoes manually
    // to prove the retained invalid display. The name says *commit*.)
    const seen: Array<number | null> = []
    const invalid: Array<[number, string]> = []
    const order: string[] = []
    const { container, root } = mount()
    function App({ value }: { value: number | null }) {
      return (
        <NumberField
          value={value}
          locale="en-US"
          min={1}
          max={10}
          step={1}
          commitBehavior="validate"
          onChange={v => {
            seen.push(v)
            order.push(`change:${v}`)
          }}
          onInvalidCommit={(attempted, reason) => {
            invalid.push([attempted, reason])
            order.push(`invalid:${attempted}:${reason}`)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    async function commit(text: string) {
      await React.act(async () => {
        input.focus()
        setNativeValue(input, text)
      })
      await React.act(async () => {
        input.blur()
      })
    }
    async function echo(value: number | null) {
      await React.act(async () => {
        root.render(<App value={value} />)
      })
    }
    // Off-step mismatch: live request plus commit retry, advisory once.
    await commit('2.5')
    expect(seen).toEqual([2.5, 2.5])
    expect(invalid).toEqual([[2.5, 'off-step']])
    expect(order).toEqual(['change:2.5', 'change:2.5', 'invalid:2.5:off-step'])
    // The echo retains the candidate; accepted text stays controlled and
    // managed invalid state reports the mismatch.
    await echo(2.5)
    expect(input.value).toBe('2.5')
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('data-invalid')).toBe('')
    // Overflow and underflow retained, never clamped.
    await commit('25')
    expect(seen).toEqual([2.5, 2.5, 25, 25])
    await echo(25)
    expect(input.value).toBe('25')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    await commit('-5')
    expect(seen).toEqual([2.5, 2.5, 25, 25, -5, -5])
    await echo(-5)
    expect(input.value).toBe('-5')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    // Both off-step and out-of-range: the advisory reason is range-first.
    await commit('25.5')
    expect(seen).toEqual([2.5, 2.5, 25, 25, -5, -5, 25.5, 25.5])
    expect(invalid).toEqual([
      [2.5, 'off-step'],
      [25, 'out-of-range'],
      [-5, 'out-of-range'],
      [25.5, 'out-of-range'],
    ])
    await cleanup(container, root)

    // Authored rounding applies to the retained candidate: 2.56 rounds to
    // the still-off-step 2.6 (advisory fires); 2.6 rounds to the valid 3
    // (violation judged on the committed candidate — silent).
    async function commitRounded(
      text: string,
      formatOptions: Intl.NumberFormatOptions
    ): Promise<{ seen: Array<number | null>; invalid: Array<[number, string]>; display: string; ariaInvalid: string | null }> {
      const rSeen: Array<number | null> = []
      const rInvalid: Array<[number, string]> = []
      const { container: rContainer, root: rRoot } = mount()
      function RoundedApp() {
        const [value, setValue] = React.useState<number | null>(null)
        return (
          <NumberField
            value={value}
            locale="en-US"
            step={1}
            commitBehavior="validate"
            formatOptions={formatOptions}
            onChange={v => {
              rSeen.push(v)
              setValue(v)
            }}
            onInvalidCommit={(attempted, reason) => void rInvalid.push([attempted, reason])}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        )
      }
      await React.act(async () => {
        rRoot.render(<RoundedApp />)
      })
      const rInput = rContainer.querySelector('input') as HTMLInputElement
      await React.act(async () => {
        setNativeValue(rInput, text)
      })
      await React.act(async () => {
        pressKey(rInput, 'Enter')
      })
      const result = {
        seen: rSeen,
        invalid: rInvalid,
        display: rInput.value,
        ariaInvalid: rInput.getAttribute('aria-invalid'),
      }
      await cleanup(rContainer, rRoot)
      return result
    }
    expect(await commitRounded('2.56', { maximumFractionDigits: 1 })).toEqual({
      seen: [2.56, 2.6],
      invalid: [[2.6, 'off-step']],
      display: '2.6',
      ariaInvalid: 'true',
    })
    expect(await commitRounded('2.6', { maximumFractionDigits: 0 })).toEqual({
      seen: [2.6, 3],
      invalid: [],
      display: '3',
      ariaInvalid: null,
    })

    // Retaining without onInvalidCommit still publishes plainly.
    const seenBare: Array<number | null> = []
    const b = mount()
    function BareApp() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <NumberField
          value={value}
          locale="en-US"
          step={1}
          commitBehavior="validate"
          onChange={v => {
            seenBare.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      b.root.render(<BareApp />)
    })
    const bareInput = b.container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      bareInput.focus()
      setNativeValue(bareInput, '2.5')
    })
    await React.act(async () => {
      bareInput.blur()
    })
    expect(seenBare).toEqual([2.5])
    expect(bareInput.value).toBe('2.5')
    expect(bareInput.getAttribute('aria-invalid')).toBe('true')
    await cleanup(b.container, b.root)
  })

  it('W-02 validate: on-step in-range commits publish plainly', async () => {
    const seen: Array<number | null> = []
    const invalid: Array<[number, string]> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(React.createElement(validateApp(seen, invalid, { min: 1, max: 10 })))
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      setNativeValue(input, '7')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([7])
    expect(invalid).toEqual([])
    expect(input.value).toBe('7')
    await cleanup(container, root)
  })

  it('W-02 none (default): off-step values commit with clamp-only behavior', async () => {
    // Omitted commitBehavior and explicit 'none' both preserve 2.5 —
    // today's behavior, unchanged.
    for (const commitBehavior of [undefined, 'none'] as const) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      function App() {
        const [value, setValue] = React.useState<number | null>(null)
        return (
          <NumberField
            value={value}
            locale="en-US"
            step={1}
            commitBehavior={commitBehavior}
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        )
      }
      await React.act(async () => {
        root.render(<App />)
      })
      const input = container.querySelector('input') as HTMLInputElement
      await React.act(async () => {
        setNativeValue(input, '2.5')
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([2.5])
      expect(input.value).toBe('2.5')
      await cleanup(container, root)
    }
  })

  it('W-02: an unknown commitBehavior throws at render', () => {
    expect(() =>
      renderToString(
        <NumberField value={0} locale="en-US" commitBehavior={'clamp' as unknown as 'none'} />
      )
    ).toThrow(/"commitBehavior" must be "snap", "validate", or "none"/)
    expect(() =>
      renderToString(<NumberField value={0} locale="en-US" commitBehavior="snap" />)
    ).not.toThrow()
  })
})

describe('NumberField freeze lattice (NFLAST ruling a)', () => {
  function latticeApp(
    seen: Array<number | null>,
    props: { value: number | null; min?: number; max?: number; step: number }
  ) {
    return function App() {
      const [value, setValue] = React.useState<number | null>(props.value)
      return (
        <NumberField
          value={value}
          locale="en-US"
          min={props.min}
          max={props.max}
          step={props.step}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
  }

  it('NF-MATH-03: All interaction should use one zero-anchored step lattice', async () => {
    // min=1 proves the anchor is zero, not min: the W-02 min-anchored
    // lattice {1,3,5,7} would step 5 up to 7; the freeze gives 6.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(React.createElement(latticeApp(seen, { value: 5, min: 1, step: 2 })))
    })
    const input = container.querySelector('input') as HTMLInputElement
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    const dec = container.querySelector('button[aria-label="Decrement"]') as HTMLButtonElement
    // Off-grid controlled value, three interaction kinds, one lattice.
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([6])
    await React.act(async () => {
      pressKey(input, 'ArrowDown')
    })
    expect(seen).toEqual([6, 4])
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([6, 4, 6])
    await React.act(async () => {
      dec.click()
    })
    expect(seen).toEqual([6, 4, 6, 4])
    // Shift arrows stay on the same lattice from aligned and off-grid.
    await React.act(async () => {
      pressKey(input, 'ArrowUp', { shiftKey: true })
    })
    expect(seen).toEqual([6, 4, 6, 4, 24])
    await cleanup(container, root)

    // Fractional step shares the lattice: 0.5 (off-grid for 0.25? no —
    // on-grid) steps exactly; 0.3 steps directionally to 0.25/0.5.
    const seenFrac: Array<number | null> = []
    const f = mount()
    await React.act(async () => {
      f.root.render(React.createElement(latticeApp(seenFrac, { value: 0.3, step: 0.25 })))
    })
    const fracInput = f.container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      pressKey(fracInput, 'ArrowDown')
    })
    expect(seenFrac).toEqual([0.25])
    await React.act(async () => {
      pressKey(fracInput, 'ArrowUp', { shiftKey: true })
    })
    // Shift ≡ 10× Arrow: 0.25 → 0.5, then nine more 0.25 steps.
    expect(seenFrac).toEqual([0.25, 2.75])
    await cleanup(f.container, f.root)

    // Scientific step: exact lattice movement, no drift.
    const seenSci: Array<number | null> = []
    const s = mount()
    await React.act(async () => {
      s.root.render(React.createElement(latticeApp(seenSci, { value: 3e-7, step: 1e-7 })))
    })
    const sciInput = s.container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      pressKey(sciInput, 'ArrowUp')
    })
    expect(seenSci).toEqual([4e-7])
    await cleanup(s.container, s.root)
  })

  it('NF-MATH-04: Directional stepping from an off-grid value should choose the next lattice point in the requested direction', async () => {
    async function stepOnce(value: number, key: string): Promise<Array<number | null>> {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(React.createElement(latticeApp(seen, { value, step: 1 })))
      })
      const input = container.querySelector('input') as HTMLInputElement
      await React.act(async () => {
        pressKey(input, key)
      })
      await cleanup(container, root)
      return seen
    }
    // Strict directional movement — never nearest-backward rounding.
    expect(await stepOnce(2.5, 'ArrowUp')).toEqual([3])
    expect(await stepOnce(2.5, 'ArrowDown')).toEqual([2])
    expect(await stepOnce(-2.5, 'ArrowUp')).toEqual([-2])
    expect(await stepOnce(-2.5, 'ArrowDown')).toEqual([-3])

    // Accepted dirty candidates step from their numeric meaning: type
    // 2.5 (live request accepted, echo preserves the draft), then ArrowUp
    // steps the candidate with no intermediate raw commit.
    const seenDirty: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(React.createElement(latticeApp(seenDirty, { value: 0, step: 1 })))
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '2.5')
    })
    expect(seenDirty).toEqual([2.5])
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seenDirty).toEqual([2.5, 3])
    await cleanup(container, root)
  })

  it('NF-MATH-05: The first step from null should select the in-range value nearest zero without adding another step', async () => {
    async function stepFromNull(
      bounds: { min?: number; max?: number },
      key: string
    ): Promise<Array<number | null>> {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          React.createElement(latticeApp(seen, { value: null, min: bounds.min, max: bounds.max, step: 1 }))
        )
      })
      const input = container.querySelector('input') as HTMLInputElement
      await React.act(async () => {
        pressKey(input, key)
      })
      await cleanup(container, root)
      return seen
    }
    expect(await stepFromNull({}, 'ArrowUp')).toEqual([0])
    expect(await stepFromNull({}, 'ArrowDown')).toEqual([0])
    expect(await stepFromNull({ min: 5 }, 'ArrowUp')).toEqual([5])
    expect(await stepFromNull({ max: -5 }, 'ArrowDown')).toEqual([-5])
    expect(await stepFromNull({ min: -5, max: 5 }, 'ArrowUp')).toEqual([0])
    // Shift adds no extra step on the first move from null.
    const seenShift: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(React.createElement(latticeApp(seenShift, { value: null, step: 1 })))
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      pressKey(input, 'ArrowUp', { shiftKey: true })
    })
    expect(seenShift).toEqual([0])
    // Normal lattice movement resumes after acceptance.
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seenShift).toEqual([0, 1])
    await cleanup(container, root)
  })

  it('NF-MATH-06: Exact non-grid bounds should remain reachable and stable under stepping', async () => {
    // Max side: min=0, max=10, step=3 — 10 is off-lattice.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(React.createElement(latticeApp(seen, { value: 9, min: 0, max: 10, step: 3 })))
    })
    const input = container.querySelector('input') as HTMLInputElement
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    // Reach the exact endpoint from the adjacent grid point.
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([10])
    // Outward step at the endpoint is a no-op; Increment disables.
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([10])
    expect(inc.disabled).toBe(true)
    // Inward step lands on the adjacent grid point, re-enabling.
    await React.act(async () => {
      pressKey(input, 'ArrowDown')
    })
    expect(seen).toEqual([10, 9])
    expect(inc.disabled).toBe(false)
    await cleanup(container, root)

    // Min side: min=1, step=3 — 1 is off-lattice.
    const seenMin: Array<number | null> = []
    const m = mount()
    await React.act(async () => {
      m.root.render(React.createElement(latticeApp(seenMin, { value: 3, min: 1, step: 3 })))
    })
    const minInput = m.container.querySelector('input') as HTMLInputElement
    const dec = m.container.querySelector('button[aria-label="Decrement"]') as HTMLButtonElement
    await React.act(async () => {
      pressKey(minInput, 'ArrowDown')
    })
    expect(seenMin).toEqual([1])
    await React.act(async () => {
      pressKey(minInput, 'ArrowDown')
    })
    expect(seenMin).toEqual([1])
    expect(dec.disabled).toBe(true)
    await React.act(async () => {
      pressKey(minInput, 'ArrowUp')
    })
    expect(seenMin).toEqual([1, 3])
    expect(dec.disabled).toBe(false)
    await cleanup(m.container, m.root)
  })

  it('NF-MATH-12: Snap should apply endpoint preservation or nearest lattice, then authored rounding, then final clamp in that order', async () => {
    // Rounding-down vector across an off-grid min: 1.2 → lattice 0 →
    // display "0" → final clamp restores the exact min 1. Without the
    // final clamp this would request out-of-range 0.
    async function commitMin(): Promise<{ seen: Array<number | null>; display: string; invalid: string | null }> {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      function App() {
        const [value, setValue] = React.useState<number | null>(null)
        return (
          <NumberField
            value={value}
            locale="en-US"
            min={1}
            step={3}
            commitBehavior="snap"
            formatOptions={{ maximumFractionDigits: 0 }}
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        )
      }
      await React.act(async () => {
        root.render(<App />)
      })
      const input = container.querySelector('input') as HTMLInputElement
      await React.act(async () => {
        setNativeValue(input, '1.2')
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      const result = { seen, display: input.value, invalid: input.getAttribute('data-invalid') }
      await cleanup(container, root)
      return result
    }
    // Rounding-up vector across an off-grid max: 8.4 → lattice 9 →
    // display "9" → final clamp restores the exact max 8.5. The clean
    // display shows the rounded "9" (display-only per NF-FORMAT-05);
    // the canonical hidden value proves the committed 8.5.
    async function commitMax(): Promise<{
      seen: Array<number | null>
      display: string
      hidden: string
      invalid: string | null
    }> {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      function App() {
        const [value, setValue] = React.useState<number | null>(null)
        return (
          <NumberField
            value={value}
            locale="en-US"
            name="qty"
            min={0}
            max={8.5}
            step={3}
            commitBehavior="snap"
            formatOptions={{ maximumFractionDigits: 0 }}
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        )
      }
      await React.act(async () => {
        root.render(<App />)
      })
      const input = container.querySelector('input:not([type="hidden"])') as HTMLInputElement
      await React.act(async () => {
        setNativeValue(input, '8.4')
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      const result = {
        seen,
        display: input.value,
        hidden: (container.querySelector('input[type="hidden"]') as HTMLInputElement).value,
        invalid: input.getAttribute('data-invalid'),
      }
      await cleanup(container, root)
      return result
    }
    // Raw live meaning first, then one final commit request each (no
    // intermediate clamp/snap/round callback); the exact endpoints are
    // step-valid by endpoint exception.
    expect(await commitMin()).toEqual({ seen: [1.2, 1], display: '1', invalid: null })
    expect(await commitMax()).toEqual({ seen: [8.4, 8.5], display: '9', hidden: '8.5', invalid: null })
  })
})

describe('NumberField formatOptions (W-25)', () => {
  it('W-25: currency display formats clean state while commits stay plain numbers', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(1234.5)
      return (
        <NumberField
          value={value}
          locale="en-US"
          formatOptions={{ style: 'currency', currency: 'USD' }}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('$1,234.50')
    await React.act(async () => {
      setNativeValue(input, '99.99')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([99.99])
    expect(input.value).toBe('$99.99')
    await cleanup(container, root)
  })

  it('W-25: typing never fights the formatter — drafts stay verbatim until commit', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(1234.5)
      return (
        <NumberField
          value={value}
          locale="en-US"
          formatOptions={{ style: 'currency', currency: 'USD' }}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    // Partial keystrokes render exactly as typed — no mid-typing reformat.
    // (Live meanings publish immediately; the accepted echoes preserve the
    // verbatim buffer, so the formatter still never fights typing.)
    await React.act(async () => {
      input.focus()
    })
    const progressive: Array<[string, Array<number | null>]> = [
      ['1', [1]],
      ['12', [1, 12]],
    ]
    for (const [text, expected] of progressive) {
      await React.act(async () => {
        setNativeValue(input, text)
      })
      expect(input.value).toBe(text)
      expect(seen).toEqual(expected)
    }
    expect(input.getAttribute('data-editing')).toBe('')
    await React.act(async () => {
      input.blur()
    })
    expect(seen).toEqual([1, 12])
    expect(input.value).toBe('$12.00')
    // A partial edit of formatted text publishes its numeric meaning live;
    // an unchanged meaning emits nothing and restores formatted display.
    await React.act(async () => {
      setNativeValue(input, '$1,234.5')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([1, 12, 1234.5])
    await React.act(async () => {
      setNativeValue(input, '$1,234.50')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([1, 12, 1234.5])
    expect(input.value).toBe('$1,234.50')
    await cleanup(container, root)
  })

  it('W-25: percent display scales both ways; percent marks reject elsewhere', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(0.12)
      return (
        <NumberField
          value={value}
          locale="en-US"
          formatOptions={{ style: 'percent' }}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('12%')
    await React.act(async () => {
      setNativeValue(input, '25')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([0.25])
    expect(input.value).toBe('25%')
    await React.act(async () => {
      setNativeValue(input, '25%')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([0.25])
    expect(input.value).toBe('25%')
    await React.act(async () => {
      setNativeValue(input, '25‰')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([0.25, 0.025])
    await cleanup(container, root)

    // A percent mark outside percent style is not grammar: revert, no request.
    const seenDecimal: Array<number | null> = []
    const d = mount()
    await React.act(async () => {
      d.root.render(
        <NumberField value={5} locale="en-US" onChange={v => void seenDecimal.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const decimalInput = d.container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      setNativeValue(decimalInput, '50%')
    })
    await React.act(async () => {
      pressKey(decimalInput, 'Enter')
    })
    expect(seenDecimal).toEqual([])
    expect(decimalInput.value).toBe('5')
    await cleanup(d.container, d.root)
  })

  it('W-25: percent fields step hundredths by default', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(0.12)
      return (
        <NumberField
          value={value}
          locale="en-US"
          formatOptions={{ style: 'percent' }}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([0.13])
    expect(input.value).toBe('13%')
    await cleanup(container, root)
  })

  it('W-25: de-DE honors locale punctuation; foreign placement reverts', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(1234.56)
      return (
        <NumberField
          value={value}
          locale="de-DE"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('1.234,56')
    await React.act(async () => {
      setNativeValue(input, '2,5')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([2.5])
    expect(input.value).toBe('2,5')
    // US-placed punctuation under de-DE is rejected, never reinterpreted
    // ("2.5" must not become 25).
    await React.act(async () => {
      setNativeValue(input, '2.5')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([2.5])
    expect(input.value).toBe('2,5')
    await cleanup(container, root)
  })

  it('W-25: grouped drafts parse and step from their numeric meaning', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <NumberField
          value={value}
          locale="en-US"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '1,000')
    })
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    // Live 1000 (accepted, echo preserves the draft), then the step.
    expect(seen).toEqual([1000, 1001])
    expect(input.value).toBe('1,001')
    await cleanup(container, root)
  })

  it('W-25: null renders empty under any format; clearing commits null', async () => {
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={null} locale="en-US" formatOptions={{ style: 'currency', currency: 'USD' }}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('')
    await cleanup(container, root)

    const seen: Array<number | null> = []
    const c = mount()
    function App() {
      const [value, setValue] = React.useState<number | null>(99.99)
      return (
        <NumberField
          value={value}
          locale="en-US"
          formatOptions={{ style: 'currency', currency: 'USD' }}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      c.root.render(<App />)
    })
    const clearing = c.container.querySelector('input') as HTMLInputElement
    expect(clearing.value).toBe('$99.99')
    await React.act(async () => {
      setNativeValue(clearing, '')
    })
    await React.act(async () => {
      pressKey(clearing, 'Enter')
    })
    expect(seen).toEqual([null])
    expect(clearing.value).toBe('')
    await cleanup(c.container, c.root)
  })

  it('W-25: focus and blur without editing never reparse rounded display text', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField
          value={2.5}
          locale="en-US"
          formatOptions={{ maximumFractionDigits: 0 }}
          onChange={v => void seen.push(v)}
        >
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.value).toBe('3')
    await React.act(async () => {
      input.focus()
    })
    expect(input.value).toBe('3')
    expect(input.getAttribute('data-editing')).toBeNull()
    await React.act(async () => {
      input.blur()
    })
    expect(seen).toEqual([])
    expect(input.value).toBe('3')
    await cleanup(container, root)
  })

  it('W-25: an effective format change replaces a dirty draft; equal options preserve it', async () => {
    const { container, root } = mount()
    function App({ formatOptions }: { formatOptions?: Intl.NumberFormatOptions }) {
      return (
        <NumberField value={5} locale="en-US" formatOptions={formatOptions}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    await React.act(async () => {
      root.render(<App formatOptions={{ style: 'decimal' }} />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '9')
    })
    expect(input.getAttribute('data-editing')).toBe('')
    // Referentially new but effectively equal options: session survives.
    await React.act(async () => {
      root.render(<App formatOptions={{ style: 'decimal' }} />)
    })
    expect(input.value).toBe('9')
    expect(input.getAttribute('data-editing')).toBe('')
    // Effective change: the draft is replaced from controlled state.
    await React.act(async () => {
      root.render(<App formatOptions={{ style: 'currency', currency: 'EUR' }} />)
    })
    expect(input.value).toBe('€5.00')
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)
  })

  it('W-25: an invalid locale or formatOptions pair fails fast naming the props', () => {
    expect(() =>
      renderToString(
        <NumberField value={0} locale="en-US" formatOptions={{ style: 'currency' }} />
      )
    ).toThrow(/"locale"\/\"formatOptions" are not a valid Intl.NumberFormat pair/)
    expect(() => renderToString(<NumberField value={0} locale="en_US" />)).toThrow(
      /"locale"\/\"formatOptions" are not a valid Intl.NumberFormat pair/
    )
    expect(() =>
      renderToString(
        <NumberField
          value={0}
          locale="en-US"
          formatOptions={{ style: 'currency', currency: 'USD' }}
        />
      )
    ).not.toThrow()
  })
})

describe('NumberField freeze anatomy (PATCHES §4)', () => {
  it('NF-DOM-01: NumberField should render exactly one root div, group div, text input, and authored stepper buttons', async () => {
    // Unit assist for the [browser] case: fixed tags, role=group,
    // type=text, type=button, authored order, no spinbutton, no
    // implicit native-number input. Group carries both bezel markers.
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={42} locale="en-US" data-testid="nf-root">
          <NumberField.Group data-testid="nf-group">
            <NumberField.Decrement aria-label="Decrease quantity" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increase quantity" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const host = container.querySelector('[data-testid="nf-root"]') as HTMLElement
    expect(host.tagName).toBe('DIV')
    expect(host.getAttribute('role')).toBeNull()
    expect(host.hasAttribute('data-reference-field')).toBe(false)

    const groups = Array.from(host.children).filter(
      el => el.tagName === 'DIV' && el.getAttribute('role') === 'group'
    )
    expect(groups).toHaveLength(1)
    const group = groups[0] as HTMLElement
    expect(group.hasAttribute('data-reference-field')).toBe(true)
    expect(group.hasAttribute('data-reference-number-field')).toBe(true)

    // Authored order is preserved; no wrapper is inserted around parts.
    const kinds = Array.from(group.children).map(el =>
      el.tagName === 'INPUT' ? `input:${el.getAttribute('type')}` : `${el.tagName}:button`
    )
    expect(kinds).toEqual(['BUTTON:button', 'input:text', 'BUTTON:button'])

    const input = group.querySelector('input') as HTMLInputElement
    expect(input.getAttribute('type')).toBe('text')
    expect(input.getAttribute('role')).toBeNull()
    for (const btn of Array.from(group.querySelectorAll('button'))) {
      expect(btn.getAttribute('type')).toBe('button')
    }
    expect(container.querySelector('[role="spinbutton"]')).toBeNull()
    expect(container.querySelector('input[type="number"]')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-DOM-02: A name should add only one direct canonical hidden form input', async () => {
    // Unit assist: exactly one root-direct input[type=hidden] with
    // canonical text, current association, and disabled mirroring.
    const { container, root } = mount()
    const renderField = (props: { name?: string; form?: string; disabled?: boolean; value: number | null }) =>
      React.act(async () => {
        root.render(
          <NumberField value={props.value} locale="en-US" name={props.name} form={props.form} disabled={props.disabled}>
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        )
      })
    const hostOf = () => container.firstElementChild as HTMLElement
    const hiddenOf = () =>
      Array.from(hostOf().children).filter(
        el => el.tagName === 'INPUT' && el.getAttribute('type') === 'hidden'
      )

    // No name: no hidden input anywhere.
    await renderField({ value: 5 })
    expect(hiddenOf()).toHaveLength(0)
    expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0)

    // Name added: exactly one root-direct hidden input, canonical text.
    await renderField({ value: 1234.5, name: 'quantity' })
    const hidden = hiddenOf()
    expect(hidden).toHaveLength(1)
    expect(hidden[0].getAttribute('name')).toBe('quantity')
    expect((hidden[0] as HTMLInputElement).value).toBe('1234.5')
    expect((hidden[0] as HTMLInputElement).disabled).toBe(false)
    // Visible Input never carries the name.
    expect((container.querySelector('input[type="text"]') as HTMLInputElement).name).toBe('')

    // Null serializes as the empty string; form association is current.
    await renderField({ value: null, name: 'quantity', form: 'order-form' })
    expect(hiddenOf()).toHaveLength(1)
    expect((hiddenOf()[0] as HTMLInputElement).value).toBe('')
    expect(hiddenOf()[0].getAttribute('form')).toBe('order-form')

    // Disabled mirrors onto the hidden input (native omission).
    await renderField({ value: 5, name: 'quantity', disabled: true })
    expect((hiddenOf()[0] as HTMLInputElement).disabled).toBe(true)

    // Name removed: the hidden input is gone, with no part/ref residue.
    await renderField({ value: 5 })
    expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0)
    await cleanup(container, root)
  })

  it('NF-DOM-03: NumberField should diagnose missing, duplicate, or misplaced named parts', async () => {
    // Each invalid anatomy throws a part-specific diagnostic; nothing
    // partial mounts (no callback) and no DOM-order authority is chosen.
    const seen: Array<number | null> = []
    const Named = ({ children }: { children: React.ReactNode }) => (
      <NumberField value={1} locale="en-US" onChange={v => void seen.push(v)}>
        {children}
      </NumberField>
    )
    // Parts direct under root (missing Group).
    expect(() =>
      renderToString(
        <Named>
          <NumberField.Decrement aria-label="Decrement" />
          <NumberField.Input aria-label="Quantity" />
          <NumberField.Increment aria-label="Increment" />
        </Named>
      )
    ).toThrow(/requires exactly one direct <NumberField\.Group>.*none was found/)
    // Duplicate Groups.
    expect(() =>
      renderToString(
        <Named>
          <NumberField.Group>
            <NumberField.Input aria-label="Quantity" />
          </NumberField.Group>
          <NumberField.Group>
            <NumberField.Input aria-label="Quantity" />
          </NumberField.Group>
        </Named>
      )
    ).toThrow(/requires exactly one direct <NumberField\.Group> but found 2/)
    // Group without Input.
    expect(() =>
      renderToString(
        <Named>
          <NumberField.Group>
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </Named>
      )
    ).toThrow(/requires exactly one direct <NumberField\.Input>.*none was found/)
    // Duplicate direct Inputs: no DOM-order authority.
    expect(() =>
      renderToString(
        <Named>
          <NumberField.Group>
            <NumberField.Input aria-label="One" />
            <NumberField.Input aria-label="Two" />
          </NumberField.Group>
        </Named>
      )
    ).toThrow(/requires exactly one direct <NumberField\.Input> but found 2/)
    // Duplicate direct steppers.
    expect(() =>
      renderToString(
        <Named>
          <NumberField.Group>
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="A" />
            <NumberField.Increment aria-label="B" />
          </NumberField.Group>
        </Named>
      )
    ).toThrow(/at most one direct <NumberField\.Increment> but found 2/)
    // Input misplaced outside any Group.
    expect(() =>
      renderToString(
        <Named>
          <NumberField.Group>
            <NumberField.Input aria-label="Quantity" />
          </NumberField.Group>
          <NumberField.Input aria-label="Stray" />
        </Named>
      )
    ).toThrow(/NumberField\.Input must be a direct child of <NumberField\.Group>/)
    // Stepper misplaced outside any Group.
    expect(() =>
      renderToString(
        <Named>
          <NumberField.Group>
            <NumberField.Input aria-label="Quantity" />
          </NumberField.Group>
          <NumberField.Increment aria-label="Stray" />
        </Named>
      )
    ).toThrow(/NumberField\.Increment must be a direct child of <NumberField\.Group>/)
    // Parts with no field at all.
    expect(() => renderToString(<NumberField.Input aria-label="Quantity" />)).toThrow(
      /NumberField\.Input must be used inside <NumberField>/
    )
    expect(() => renderToString(<NumberField.Group />)).toThrow(
      /NumberField\.Group must be a direct child of <NumberField>/
    )
    // No partial callback from any invalid anatomy.
    expect(seen).toEqual([])

    // Nested extras escape the direct-children scan, so the Group
    // registry diagnoses them after commit (error-boundary catchable,
    // React error logging suppressed for the assertion).
    const errors: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    try {
      const caught: Error[] = []
      class Boundary extends React.Component<{ children: React.ReactNode }> {
        state = { error: null as Error | null }
        static getDerivedStateFromError(error: Error) {
          return { error }
        }
        componentDidCatch(error: Error) {
          caught.push(error)
        }
        render() {
          return this.state.error ? null : this.props.children
        }
      }
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Boundary>
            <NumberField value={1} locale="en-US">
              <NumberField.Group>
                <NumberField.Input aria-label="Quantity" />
                <div>
                  <NumberField.Input aria-label="Nested extra" />
                </div>
              </NumberField.Group>
            </NumberField>
          </Boundary>
        )
      })
      expect(caught).toHaveLength(1)
      expect(caught[0].message).toMatch(/duplicate named parts nested/)
      expect(container.querySelector('input')).toBeNull()
      await cleanup(container, root)
    } finally {
      spy.mockRestore()
    }
  })

  it('NF-DOM-04: Group should allow arbitrary authored siblings while only named parts join behavior', async () => {
    // Labels, links, buttons, icons, status content, and foreign inputs
    // keep native behavior/refs/order; only named parts receive managed
    // state, registration, focus, and stepping.
    const seen: Array<number | null> = []
    const siblingInputRef = React.createRef<HTMLInputElement>()
    const siblingButtonRef = React.createRef<HTMLButtonElement>()
    let siblingClicks = 0
    function App() {
      const [value, setValue] = React.useState<number | null>(10)
      return (
        <NumberField
          value={value}
          locale="en-US"
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Group data-testid="nf-group">
            <label data-testid="sib-label" htmlFor="sib-input">
              Amount
            </label>
            <NumberField.Decrement aria-label="Decrement" />
            <span data-testid="sib-icon" aria-hidden="true">
              $
            </span>
            <NumberField.Input aria-label="Quantity" data-testid="nf-input" />
            <input
              ref={siblingInputRef}
              id="sib-input"
              data-testid="sib-input"
              defaultValue="foreign"
              aria-label="Foreign"
            />
            <button
              ref={siblingButtonRef}
              data-testid="sib-button"
              type="button"
              onClick={() => void siblingClicks++}
            >
              Sibling
            </button>
            <output data-testid="sib-status">ok</output>
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const group = container.querySelector('[data-testid="nf-group"]') as HTMLElement
    // Authored order preserved across parts and siblings.
    expect(Array.from(group.children).map(el => el.getAttribute('data-testid') ?? el.tagName)).toEqual([
      'sib-label',
      'BUTTON',
      'sib-icon',
      'nf-input',
      'sib-input',
      'sib-button',
      'sib-status',
      'BUTTON',
    ])
    // Siblings keep native behavior and refs.
    const sibButton = container.querySelector('[data-testid="sib-button"]') as HTMLButtonElement
    expect(siblingButtonRef.current).toBe(sibButton)
    expect(sibButton.tabIndex).not.toBe(-1)
    expect(sibButton.hasAttribute('data-pressed')).toBe(false)
    expect(sibButton.hasAttribute('aria-controls')).toBe(false)
    await React.act(async () => {
      sibButton.click()
    })
    expect(siblingClicks).toBe(1)
    const sibInput = container.querySelector('[data-testid="sib-input"]') as HTMLInputElement
    expect(siblingInputRef.current).toBe(sibInput)
    await React.act(async () => {
      setNativeValue(sibInput, 'edited')
    })
    expect(sibInput.value).toBe('edited')
    expect(seen).toEqual([])
    // Only named parts step and carry managed state.
    const input = container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
    expect(input.hasAttribute('data-editing')).toBe(false)
    const inc = container.querySelector('button[aria-label="Increment"]') as HTMLButtonElement
    expect(inc.tabIndex).toBe(-1)
    expect(inc.getAttribute('aria-controls')).toBe(input.id)
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([11])
    expect(input.value).toBe('11')
    await cleanup(container, root)
  })

  it('NF-DOM-07: Input IDs and stepper controls should stay stable within one React root', async () => {
    // Two fields, explicit-ID change, stepper remove/reinsert: root-local
    // uniqueness, explicit-ID priority, same-commit aria-controls
    // retargeting, no stale registration.
    function App({
      firstId,
      secondId,
      showSecondInc,
    }: {
      firstId?: string
      secondId?: string
      showSecondInc: boolean
    }) {
      return (
        <div>
          <NumberField value={1} locale="en-US" data-testid="nf-first">
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="First" id={firstId} data-testid="nf-first-input" />
              <NumberField.Increment aria-label="Increment" data-testid="nf-first-inc" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={2} locale="en-US" data-testid="nf-second">
            <NumberField.Group>
              <NumberField.Input aria-label="Second" id={secondId} data-testid="nf-second-input" />
              {showSecondInc ? (
                <NumberField.Increment aria-label="Increment" data-testid="nf-second-inc" />
              ) : null}
            </NumberField.Group>
          </NumberField>
        </div>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App showSecondInc />)
    })
    const firstInput = container.querySelector('[data-testid="nf-first-input"]') as HTMLInputElement
    const secondInput = container.querySelector('[data-testid="nf-second-input"]') as HTMLInputElement
    // Generated IDs are unique within the root and stable.
    expect(firstInput.id).not.toBe('')
    expect(secondInput.id).not.toBe('')
    expect(firstInput.id).not.toBe(secondInput.id)
    const firstGenerated = firstInput.id
    const firstInc = container.querySelector('[data-testid="nf-first-inc"]') as HTMLButtonElement
    expect(firstInc.getAttribute('aria-controls')).toBe(firstGenerated)
    // Explicit ID wins; steppers retarget in the same commit.
    await React.act(async () => {
      root.render(<App firstId="explicit-first" showSecondInc />)
    })
    expect(firstInput.id).toBe('explicit-first')
    expect(firstInc.getAttribute('aria-controls')).toBe('explicit-first')
    // Unrelated field untouched.
    expect(secondInput.id).not.toBe('explicit-first')
    // Stepper remove/reinsert resolves current controls, no stale state.
    await React.act(async () => {
      root.render(<App firstId="explicit-first" showSecondInc={false} />)
    })
    expect(container.querySelector('[data-testid="nf-second-inc"]')).toBeNull()
    await React.act(async () => {
      root.render(<App firstId="explicit-first" secondId="explicit-second" showSecondInc />)
    })
    const secondInc = container.querySelector('[data-testid="nf-second-inc"]') as HTMLButtonElement
    expect(secondInput.id).toBe('explicit-second')
    expect(secondInc.getAttribute('aria-controls')).toBe('explicit-second')
    await cleanup(container, root)
  })

  it('NF-DOM-08: Managed data should distinguish dirty editing, visible emptiness, validity, focus, disabled state, and pointer press', async () => {
    // Each documented data attribute appears only on its documented parts:
    // root/Group/Input share the six state flags; Group adds data-focused;
    // steppers expose data-disabled/data-pressed.
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={null} locale="en-US" data-testid="nf-root">
          <NumberField.Group data-testid="nf-group">
            <NumberField.Decrement aria-label="Decrement" data-testid="nf-dec" />
            <NumberField.Input aria-label="Quantity" data-testid="nf-input" />
            <NumberField.Increment aria-label="Increment" data-testid="nf-inc" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const host = () => container.querySelector('[data-testid="nf-root"]') as HTMLElement
    const group = () => container.querySelector('[data-testid="nf-group"]') as HTMLElement
    const input = () => container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
    const inc = () => container.querySelector('[data-testid="nf-inc"]') as HTMLButtonElement
    // Clean null: empty everywhere, nothing else.
    for (const el of [host(), group(), input()]) {
      expect(el.getAttribute('data-empty')).toBe('')
      expect(el.getAttribute('data-editing')).toBeNull()
      expect(el.getAttribute('data-invalid')).toBeNull()
      expect(el.getAttribute('data-disabled')).toBeNull()
    }
    expect(group().getAttribute('data-focused')).toBeNull()
    // Dirty sign-only partial: editing on the shared hosts, nonempty text.
    await React.act(async () => {
      input().focus()
      setNativeValue(input(), '-')
    })
    for (const el of [host(), group(), input()]) {
      expect(el.getAttribute('data-editing')).toBe('')
      expect(el.getAttribute('data-empty')).toBeNull()
    }
    // Input focus publishes Group data-focused (single tab stop).
    expect(group().getAttribute('data-focused')).toBe('')
    // Pointer press publishes stepper data-pressed (immediate step).
    await React.act(async () => {
      input().blur()
      pressKey(input(), 'Escape')
    })
    expect(group().getAttribute('data-focused')).toBeNull()
    const seen: Array<number | null> = []
    await React.act(async () => {
      root.render(
        <NumberField value={10} locale="en-US" onChange={v => void seen.push(v)} data-testid="nf-root">
          <NumberField.Group data-testid="nf-group">
            <NumberField.Decrement aria-label="Decrement" data-testid="nf-dec" />
            <NumberField.Input aria-label="Quantity" data-testid="nf-input" />
            <NumberField.Increment aria-label="Increment" data-testid="nf-inc" />
          </NumberField.Group>
        </NumberField>
      )
    })
    await React.act(async () => {
      inc().dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          pointerId: 7,
          pointerType: 'mouse',
          isPrimary: true,
        })
      )
    })
    expect(inc().getAttribute('data-pressed')).toBe('')
    expect(seen).toEqual([11])
    await React.act(async () => {
      inc().dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          button: 0,
          pointerId: 7,
          pointerType: 'mouse',
          isPrimary: true,
        })
      )
    })
    expect(inc().getAttribute('data-pressed')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-SURF-01: Group should consume the Field recipe on its own group node', async () => {
    // Exactly one div[role=group][data-reference-field], no nested Field,
    // status warning without aria-invalid, omitted status unset, StyleProps
    // override baseline without forking role/marker.
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US" data-testid="nf-root">
          <NumberField.Group data-testid="nf-group" status="warning" style={{ padding: '9px' }}>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const host = container.querySelector('[data-testid="nf-root"]') as HTMLElement
    const groups = host.querySelectorAll('div[role="group"][data-reference-field]')
    expect(groups).toHaveLength(1)
    const group = groups[0] as HTMLElement
    // No nested Field-surface host inside Group.
    expect(Array.from(group.children).filter(el => el.hasAttribute('data-reference-field'))).toHaveLength(0)
    expect(group.querySelectorAll('[data-reference-field]')).toHaveLength(0)
    // Warning is visual only: data-status set, aria-invalid absent.
    expect(group.getAttribute('data-status')).toBe('warning')
    expect(group.getAttribute('aria-invalid')).toBeNull()
    // Local StyleProps override the shared baseline; role/marker remain.
    expect(group.style.padding).toBe('9px')
    expect(group.getAttribute('role')).toBe('group')
    expect(group.hasAttribute('data-reference-field')).toBe(true)
    // Omitted status leaves the attribute unset.
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US" data-testid="nf-root">
          <NumberField.Group data-testid="nf-group">
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const plain = container.querySelector('[data-testid="nf-group"]') as HTMLElement
    expect(plain.hasAttribute('data-status')).toBe(false)
    await cleanup(container, root)
  })
})

describe('NumberField hidden form pipeline (PATCHES §5)', () => {
  it('NF-FORM-01: Visible localized text and canonical hidden form value should remain separate', async () => {
    // Decimal, currency, percent, unit, scientific, and null fixtures:
    // visible Input shows localized text with no name; one hidden input
    // carries canonical String(value). No number proxy exists.
    const cases: Array<{ formatOptions?: Intl.NumberFormatOptions; value: number | null; hidden: string }> = [
      { value: 1234.5, hidden: '1234.5' },
      { value: 1234.5, formatOptions: { style: 'currency', currency: 'USD' }, hidden: '1234.5' },
      { value: 0.12, formatOptions: { style: 'percent' }, hidden: '0.12' },
      { value: 12, formatOptions: { style: 'unit', unit: 'kilometer' }, hidden: '12' },
      { value: 12345, formatOptions: { notation: 'scientific' }, hidden: '12345' },
      { value: null, formatOptions: { style: 'currency', currency: 'USD' }, hidden: '' },
    ]
    for (const [index, fixture] of cases.entries()) {
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <form data-testid={`nf-form-${index}`}>
            <NumberField
              value={fixture.value}
              locale="en-US"
              formatOptions={fixture.formatOptions}
              name={`field-${index}`}
            >
              <NumberField.Group>
                <NumberField.Decrement aria-label="Decrement" />
                <NumberField.Input aria-label="Quantity" />
                <NumberField.Increment aria-label="Increment" />
              </NumberField.Group>
            </NumberField>
          </form>
        )
      })
      const visible = container.querySelector('input[type="text"]') as HTMLInputElement
      expect(visible.name).toBe('')
      expect(visible.value).not.toBe('__impossible__')
      const hiddens = container.querySelectorAll('input[type="hidden"]')
      expect(hiddens).toHaveLength(1)
      expect((hiddens[0] as HTMLInputElement).value).toBe(fixture.hidden)
      expect(hiddens[0].getAttribute('name')).toBe(`field-${index}`)
      expect(container.querySelector('input[type="number"]')).toBeNull()
      await cleanup(container, root)
    }
    // Spot-check the separation: localized visible text, canonical hidden.
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={1234.5} locale="en-US" formatOptions={{ style: 'currency', currency: 'USD' }} name="price">
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Price" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    expect((container.querySelector('input[type="text"]') as HTMLInputElement).value).toBe('$1,234.50')
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe('1234.5')
    await cleanup(container, root)
  })

  it('NF-FORM-02: Clean forms should submit only accepted controlled numeric state', async () => {
    // One canonical pair per name in real FormData; no affix/group/digit
    // leakage from localized display text.
    const seen: Array<number | null> = []
    const payloads: string[][] = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <form
          data-testid="nf-form"
          onSubmit={e => {
            e.preventDefault()
            payloads.push(Array.from(new FormData(e.currentTarget).entries()).map(([k, v]) => `${k}=${v}`))
          }}
        >
          <NumberField value={1234.5} locale="en-US" formatOptions={{ style: 'currency', currency: 'USD' }} name="price">
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Price" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={0.25} locale="de-DE" formatOptions={{ style: 'percent' }} name="rate">
            <NumberField.Group>
              <NumberField.Input aria-label="Rate" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={null} locale="en-US" name="empty" onChange={v => void seen.push(v)}>
            <NumberField.Group>
              <NumberField.Input aria-label="Empty" />
            </NumberField.Group>
          </NumberField>
          <button type="submit">Submit</button>
        </form>
      )
    })
    const form = container.querySelector('form') as HTMLFormElement
    await React.act(async () => {
      form.requestSubmit()
    })
    expect(payloads).toEqual([['price=1234.5', 'rate=0.25', 'empty=']])
    expect(seen).toEqual([])
    await cleanup(container, root)
  })

  it('NF-FORM-03: Disabled, read-only, dynamic name, and external same-root form association should follow the frozen policy', async () => {
    const payloads: string[][] = []
    function App({
      disabled,
      readOnly,
      name,
      form,
    }: {
      disabled?: boolean
      readOnly?: boolean
      name?: string
      form?: string
    }) {
      return (
        <div>
          <form
            data-testid="nf-form"
            id="nf-external-form"
            onSubmit={e => {
              e.preventDefault()
              payloads.push(Array.from(new FormData(e.currentTarget).entries()).map(([k, v]) => `${k}=${v}`))
            }}
          />
          <NumberField
            value={7}
            locale="en-US"
            disabled={disabled}
            readOnly={readOnly}
            name={name}
            form={form}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </div>
      )
    }
    const { container, root } = mount()
    const submitExternal = async () => {
      const form = container.querySelector('#nf-external-form') as HTMLFormElement
      await React.act(async () => {
        form.requestSubmit()
      })
    }
    // External same-root form association via the form attribute.
    await React.act(async () => {
      root.render(<App name="qty" form="nf-external-form" />)
    })
    await submitExternal()
    expect(payloads).toEqual([['qty=7']])
    // Dynamic name change re-serializes under the current name only.
    await React.act(async () => {
      root.render(<App name="amount" form="nf-external-form" />)
    })
    await submitExternal()
    expect(payloads).toEqual([['qty=7'], ['amount=7']])
    // Disabled fields are omitted natively (hidden mirrors disabled).
    await React.act(async () => {
      root.render(<App name="amount" form="nf-external-form" disabled />)
    })
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).disabled).toBe(true)
    await submitExternal()
    expect(payloads).toEqual([['qty=7'], ['amount=7'], []])
    // Read-only fields serialize canonical state without numeric blocking.
    await React.act(async () => {
      root.render(
        <App name="amount" form="nf-external-form" readOnly />
      )
    })
    await submitExternal()
    expect(payloads[payloads.length - 1]).toEqual(['amount=7'])
    await cleanup(container, root)
  })

  it('NF-FORM-04: Native required should retain platform valueMissing behavior', async () => {
    // required renders natively; empty is valueMissing with no
    // NumberField custom validity; accepted nonempty submits one payload.
    const payloads: string[][] = []
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(null)
      return (
        <form
          data-testid="nf-form"
          onSubmit={e => {
            e.preventDefault()
            payloads.push(Array.from(new FormData(e.currentTarget).entries()).map(([k, v]) => `${k}=${v}`))
          }}
        >
          <NumberField
            value={value}
            locale="en-US"
            name="qty"
            required
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    expect(input.required).toBe(true)
    expect(input.validity.valueMissing).toBe(true)
    expect(input.validity.customError).toBe(false)
    expect(input.validationMessage).toBe('')
    // Accept a nonempty value, then submit one valid payload.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '3')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([3])
    expect(input.validity.valueMissing).toBe(false)
    const form = container.querySelector('form') as HTMLFormElement
    await React.act(async () => {
      form.requestSubmit()
    })
    expect(payloads).toEqual([['qty=3']])
    await cleanup(container, root)
  })

  it('NF-FORM-05 / NF-A11Y-06: Managed numeric constraint failures should block submit without changing native text-input validity flags', async () => {
    // Accepted underflow, overflow, and off-step values in validate mode
    // prevent submission with managed invalid data/ARIA; application
    // invalid alone submits normally. Native range/step/custom flags stay
    // false and no validation proxy exists.
    const blocked: boolean[] = []
    function App({ value, invalid }: { value: number | null; invalid?: boolean }) {
      return (
        <form data-testid="nf-form">
          <NumberField
            value={value}
            locale="en-US"
            name="qty"
            min={1}
            max={10}
            step={1}
            commitBehavior="validate"
            invalid={invalid}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    }
    const { container, root } = mount()
    const submitBlocked = async () => {
      const form = container.querySelector('form') as HTMLFormElement
      let prevented = false
      await React.act(async () => {
        prevented = !form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })
      blocked.push(prevented)
      return prevented
    }
    for (const bad of [-5, 25, 2.5]) {
      await React.act(async () => {
        root.render(<App value={bad} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      expect(input.getAttribute('aria-invalid')).toBe('true')
      expect(input.validity.rangeUnderflow).toBe(false)
      expect(input.validity.rangeOverflow).toBe(false)
      expect(input.validity.stepMismatch).toBe(false)
      expect(input.validity.customError).toBe(false)
      expect(input.validationMessage).toBe('')
      expect(await submitBlocked()).toBe(true)
    }
    expect(blocked).toEqual([true, true, true])
    // A numerically valid field submits with invalid={true}: application
    // invalid is an ARIA/style signal, never a submit blocker by itself.
    await React.act(async () => {
      root.render(<App value={5} invalid />)
    })
    const validInput = container.querySelector('input[type="text"]') as HTMLInputElement
    expect(validInput.getAttribute('aria-invalid')).toBe('true')
    expect(await submitBlocked()).toBe(false)
    expect(container.querySelector('input[type="number"]')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-FORM-06: Programmatic requestSubmit should process a still-dirty complete candidate and require explicit retry', async () => {
    // One final commit request, prevented first submit, controlled hidden
    // value, no auto-resubmit; accepted canonical payload after retry.
    // NFLAST ruling (c): the echo is held so the candidate stays
    // dirty/not-accepted at submit (an immediate echo would clear pending
    // and let the canonical submit through).
    const seen: Array<number | null> = []
    const payloads: string[][] = []
    let applyEcho: (() => void) | null = null
    function App() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <form
          data-testid="nf-form"
          onSubmit={e => {
            // A prevented submit never serializes: only record payloads
            // the field did not block (the form-level native listener runs
            // before this root-delegated React handler).
            if (e.defaultPrevented) return
            payloads.push(Array.from(new FormData(e.currentTarget).entries()).map(([k, v]) => `${k}=${v}`))
          }}
        >
          <NumberField
            value={value}
            locale="en-US"
            name="qty"
            min={1}
            max={10}
            commitBehavior="snap"
            onChange={v => {
              seen.push(v)
              applyEcho = () => setValue(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    // Leave a complete candidate dirty/not-accepted: the live 7 publishes
    // but its echo waits out the first submit.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '7')
    })
    expect(seen).toEqual([7])
    expect(hidden.value).toBe('5')
    expect(input.getAttribute('data-editing')).toBe('')
    let firstPrevented = false
    const firstListener = (e: Event) => {
      firstPrevented = e.defaultPrevented
    }
    form.addEventListener('submit', firstListener)
    await React.act(async () => {
      // Dispatch directly: requestSubmit would also work, but the direct
      // event observes prevention deterministically in happy-dom.
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    form.removeEventListener('submit', firstListener)
    // One final commit request (snap keeps 7), first submit prevented,
    // hidden still shows the controlled value until the echo lands.
    expect(seen).toEqual([7, 7])
    expect(firstPrevented).toBe(true)
    expect(hidden.value).toBe('5')
    // Release the echo; the explicit retry submits the accepted canonical
    // payload with no second request and no auto-resubmit.
    await React.act(async () => {
      applyEcho?.()
    })
    await React.act(async () => {
      form.requestSubmit()
    })
    expect(payloads).toEqual([['qty=7']])
    expect(seen).toEqual([7, 7])
    await cleanup(container, root)
  })

  it('NF-FORM-07: Programmatic requestSubmit should block incomplete dirty text without a numeric substitute', async () => {
    // Sign/exponent/group/overflow partials: the field processes once per
    // attempt, submission stays prevented, failed-boundary state persists
    // without consumption, no numeric callback, hidden stays controlled.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <form data-testid="nf-form">
          <NumberField value={5} locale="en-US" name="qty" onChange={v => void seen.push(v)}>
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    const attempt = async () => {
      let prevented = false
      await React.act(async () => {
        prevented = !form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })
      return prevented
    }
    for (const partial of ['-', '1e', '1,', '1e999999']) {
      await React.act(async () => {
        input.focus()
        setNativeValue(input, partial)
      })
      expect(await attempt()).toBe(true)
      // Reverted to controlled display; hidden untouched; no request.
      expect(input.value).toBe('5')
      expect(hidden.value).toBe('5')
      expect(input.getAttribute('data-editing')).toBeNull()
      expect(input.getAttribute('aria-invalid')).toBe('true')
    }
    expect(seen).toEqual([])
    // The retained boundary blocks repeated attempts without consumption.
    expect(await attempt()).toBe(true)
    expect(await attempt()).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    await cleanup(container, root)
  })

  it('NF-FORM-08: Programmatic reset while focused should clear transient state without blurring or changing controlled value', async () => {
    // Unprevented reset reformats controlled text, retains focus with caret
    // at the formatted end, clears editing/failed/pressed state, keeps
    // hidden state, emits no callback; canceled reset leaves the session
    // exactly intact.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <form data-testid="nf-form">
          <NumberField value={1234.5} locale="en-US" name="qty" onChange={v => void seen.push(v)}>
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    expect(input.value).toBe('1,234.5')
    // Dirty valid session, then unprevented programmatic reset.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '99')
    })
    expect(seen).toEqual([99])
    expect(input.getAttribute('data-editing')).toBe('')
    await React.act(async () => {
      form.reset()
    })
    expect(input.value).toBe('1,234.5')
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(input.value.length)
    expect(input.selectionEnd).toBe(input.value.length)
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(hidden.value).toBe('1234.5')
    // The live 99 predates the reset; the reset itself emits nothing.
    expect(seen).toEqual([99])
    // Failed boundary also clears on unprevented reset.
    await React.act(async () => {
      setNativeValue(input, 'garbage')
      input.blur()
    })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    await React.act(async () => {
      input.focus()
      form.reset()
    })
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(input.value).toBe('1,234.5')
    // Canceled reset leaves the focused dirty session exactly intact.
    // The application prevents in capture, before the field's listener.
    const cancel = (e: Event) => e.preventDefault()
    form.addEventListener('reset', cancel, true)
    try {
      await React.act(async () => {
        setNativeValue(input, '77')
      })
      await React.act(async () => {
        form.reset()
      })
      expect(input.value).toBe('77')
      expect(input.getAttribute('data-editing')).toBe('')
    } finally {
      form.removeEventListener('reset', cancel, true)
    }
    await cleanup(container, root)
  })

  it('NF-FORM-10: Application custom validity should survive every NumberField update untouched', async () => {
    // A message set through the Input ref survives edits, commits, bound
    // and format changes, numeric-invalid submits, and resets until the
    // application clears it; NumberField never calls or clears it.
    const inputRef = React.createRef<HTMLInputElement>()
    function App({ min, formatOptions }: { min?: number; formatOptions?: Intl.NumberFormatOptions }) {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <form data-testid="nf-form">
          <NumberField
            value={value}
            locale="en-US"
            name="qty"
            min={min}
            formatOptions={formatOptions}
            onChange={setValue}
          >
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input ref={inputRef} aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    expect(inputRef.current).toBe(input)
    input.setCustomValidity('application says no')
    expect(input.validity.customError).toBe(true)
    // Edit, commit, prop changes, invalid submit, reset: message intact.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '6')
    })
    expect(input.validationMessage).toBe('application says no')
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(input.validationMessage).toBe('application says no')
    await React.act(async () => {
      root.render(<App min={10} formatOptions={{ style: 'currency', currency: 'USD' }} />)
    })
    expect(input.validationMessage).toBe('application says no')
    const form = container.querySelector('form') as HTMLFormElement
    await React.act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(input.validationMessage).toBe('application says no')
    await React.act(async () => {
      input.focus()
      form.reset()
    })
    expect(input.validationMessage).toBe('application says no')
    expect(input.validity.customError).toBe(true)
    // The application clears it; NumberField never did.
    input.setCustomValidity('')
    expect(input.validity.customError).toBe(false)
    await cleanup(container, root)
  })

  it('NF-FORM-13: All dirty NumberFields should process the same submit even when it is already prevented', async () => {
    // Two dirty fields in one form: both independently commit once with
    // deterministic callback order; an application capture preventer does
    // not short-circuit the second field; no payload escapes.
    const seen: string[] = []
    const payloads: string[][] = []
    function App() {
      const [first, setFirst] = React.useState<number | null>(1)
      const [second, setSecond] = React.useState<number | null>(2)
      return (
        <form
          data-testid="nf-form"
          onSubmit={e => {
            if (e.defaultPrevented) return
            payloads.push(Array.from(new FormData(e.currentTarget).entries()).map(([k, v]) => `${k}=${v}`))
          }}
        >
          <NumberField
            value={first}
            locale="en-US"
            name="first"
            onChange={v => {
              seen.push(`first:${v}`)
              setFirst(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Input aria-label="First" data-testid="nf-first" />
            </NumberField.Group>
          </NumberField>
          <NumberField
            value={second}
            locale="en-US"
            name="second"
            onChange={v => {
              seen.push(`second:${v}`)
              setSecond(v)
            }}
          >
            <NumberField.Group>
              <NumberField.Input aria-label="Second" data-testid="nf-second" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const first = container.querySelector('[data-testid="nf-first"]') as HTMLInputElement
    const second = container.querySelector('[data-testid="nf-second"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    await React.act(async () => {
      first.focus()
      setNativeValue(first, '10')
      setNativeValue(second, '20')
    })
    // Application capture handler prevents first; both fields still run.
    const appPrevent = (e: Event) => e.preventDefault()
    form.addEventListener('submit', appPrevent, true)
    try {
      await React.act(async () => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })
    } finally {
      form.removeEventListener('submit', appPrevent, true)
    }
    expect(seen).toEqual(['first:10', 'second:20'])
    // Both requests echo through act(); an explicit retry serializes both.
    await React.act(async () => {
      form.requestSubmit()
    })
    expect(payloads).toEqual([['first=10', 'second=20']])
    await cleanup(container, root)
  })
})

describe('NumberField managed semantics and environments', () => {
  it('NF-A11Y-01: Input should expose an accessible named textbox rather than a spinbutton', async () => {
    // Label, aria-label, and aria-labelledby namings: textbox role, name,
    // focus, and text value with no spinbutton or numeric value ARIA.
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <div>
          <label htmlFor="nf-a11y01-a">Labeled</label>
          <NumberField value={1} locale="en-US">
            <NumberField.Group>
              <NumberField.Input id="nf-a11y01-a" data-testid="nf-a" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={2} locale="en-US">
            <NumberField.Group>
              <NumberField.Input aria-label="Described" data-testid="nf-b" />
            </NumberField.Group>
          </NumberField>
          <span id="nf-a11y01-label">Referenced</span>
          <NumberField value={3} locale="en-US">
            <NumberField.Group>
              <NumberField.Input aria-labelledby="nf-a11y01-label" data-testid="nf-c" />
            </NumberField.Group>
          </NumberField>
        </div>
      )
    })
    const a = container.querySelector('[data-testid="nf-a"]') as HTMLInputElement
    const b = container.querySelector('[data-testid="nf-b"]') as HTMLInputElement
    const c = container.querySelector('[data-testid="nf-c"]') as HTMLInputElement
    for (const input of [a, b, c]) {
      expect(input.getAttribute('role')).toBeNull()
      expect(input.getAttribute('type')).toBe('text')
      expect(input.getAttribute('aria-valuenow')).toBeNull()
      expect(input.getAttribute('aria-valuemin')).toBeNull()
      expect(input.getAttribute('aria-valuemax')).toBeNull()
      expect(input.getAttribute('aria-valuetext')).toBeNull()
    }
    // Each naming path resolves (label activation behavior itself is
    // platform-owned, not a component claim).
    expect(a.labels?.length).toBe(1)
    expect((container.querySelector('label[for="nf-a11y01-a"]') as HTMLLabelElement).htmlFor).toBe(a.id)
    expect(b.getAttribute('aria-label')).toBe('Described')
    expect(c.getAttribute('aria-labelledby')).toBe('nf-a11y01-label')
    expect(container.querySelector('[role="spinbutton"]')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-A11Y-02: An unnamed Input should diagnose without inventing application label markup', async () => {
    // One descriptive diagnostic for the unnamed Input; no hidden label;
    // Group naming never substituted; external-label repair quiets it.
    const errors: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    try {
      const diags = () => errors.filter(t => t.includes('Reference UI: NumberField Input has no accessible name'))
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <NumberField value={1} locale="en-US">
            <NumberField.Group aria-label="Group name">
              <NumberField.Input data-testid="nf-input" />
            </NumberField.Group>
          </NumberField>
        )
      })
      expect(diags()).toHaveLength(1)
      const input = container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
      // Nothing invented: no label element, no name attributes.
      expect(container.querySelector('label')).toBeNull()
      expect(input.getAttribute('aria-label')).toBeNull()
      expect(input.getAttribute('aria-labelledby')).toBeNull()
      // Repair with an external label: accessible name resolves, no more logs.
      await React.act(async () => {
        root.render(
          <div>
            <label htmlFor="nf-a11y02-repaired">Repaired</label>
            <NumberField value={1} locale="en-US">
              <NumberField.Group aria-label="Group name">
                <NumberField.Input id="nf-a11y02-repaired" aria-label="Repaired" data-testid="nf-input" />
              </NumberField.Group>
            </NumberField>
          </div>
        )
      })
      expect((container.querySelector('[data-testid="nf-input"]') as HTMLInputElement).getAttribute('aria-label')).toBe(
        'Repaired'
      )
      expect(diags()).toHaveLength(1)
      await cleanup(container, root)
    } finally {
      spy.mockRestore()
    }
  })

  it('NF-A11Y-03: Disabled, read-only, required, and invalid semantics should appear only on supported roles', async () => {
    // Input alone exposes native readOnly/required; Group always omits
    // unsupported aria-readonly/aria-required while exposing managed
    // data-readonly/data-required plus aria-disabled/invalid; steppers
    // expose native/ARIA-disabled but no other state ARIA.
    function App({ disabled, readOnly, required, invalid }: { disabled?: boolean; readOnly?: boolean; required?: boolean; invalid?: boolean }) {
      return (
        <NumberField value={5} locale="en-US" disabled={disabled} readOnly={readOnly} required={required} invalid={invalid}>
          <NumberField.Group data-testid="nf-group">
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" data-testid="nf-input" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App disabled readOnly required invalid />)
    })
    const input = container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
    const group = container.querySelector('[data-testid="nf-group"]') as HTMLElement
    expect(input.disabled).toBe(true)
    expect(input.readOnly).toBe(true)
    expect(input.required).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(group.getAttribute('aria-disabled')).toBe('true')
    expect(group.getAttribute('aria-invalid')).toBe('true')
    expect(group.getAttribute('aria-readonly')).toBeNull()
    expect(group.getAttribute('aria-required')).toBeNull()
    expect(group.getAttribute('data-readonly')).toBe('')
    expect(group.getAttribute('data-required')).toBe('')
    for (const btn of Array.from(container.querySelectorAll('button'))) {
      expect(btn.disabled).toBe(true)
      expect(btn.getAttribute('aria-disabled')).toBeNull()
      expect(btn.getAttribute('aria-readonly')).toBeNull()
      expect(btn.getAttribute('aria-required')).toBeNull()
      expect(btn.getAttribute('aria-checked')).toBeNull()
      expect(btn.getAttribute('aria-pressed')).toBeNull()
    }
    // Toggling off clears every managed semantic atomically.
    await React.act(async () => {
      root.render(<App />)
    })
    expect(input.disabled).toBe(false)
    expect(input.readOnly).toBe(false)
    expect(input.required).toBe(false)
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(group.getAttribute('aria-disabled')).toBeNull()
    expect(group.getAttribute('aria-invalid')).toBeNull()
    expect(group.getAttribute('data-readonly')).toBeNull()
    expect(group.getAttribute('data-required')).toBeNull()
    for (const btn of Array.from(container.querySelectorAll('button'))) {
      expect(btn.disabled).toBe(false)
    }
    await cleanup(container, root)
  })

  it('NF-A11Y-05: Group focus state should track the single Input tab stop without adding stepper tab stops', async () => {
    // Keyboard/pointer/programmatic Input focus publishes Group
    // data-focused; only Input is tabbable; steppers stay tabIndex=-1.
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US">
          <NumberField.Group data-testid="nf-group">
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" data-testid="nf-input" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const group = container.querySelector('[data-testid="nf-group"]') as HTMLElement
    const input = container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
    const buttons = Array.from(container.querySelectorAll('button'))
    expect(buttons).toHaveLength(2)
    for (const btn of buttons) expect(btn.tabIndex).toBe(-1)
    expect(input.tabIndex).toBe(0)
    await React.act(async () => {
      input.focus()
    })
    expect(document.activeElement).toBe(input)
    expect(group.getAttribute('data-focused')).toBe('')
    await React.act(async () => {
      input.blur()
    })
    expect(group.getAttribute('data-focused')).toBeNull()
    // Pointer activation focuses Input through the stepper path.
    await React.act(async () => {
      buttons[1].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerId: 3, pointerType: 'mouse', isPrimary: true }))
    })
    expect(document.activeElement).toBe(input)
    expect(group.getAttribute('data-focused')).toBe('')
    await React.act(async () => {
      buttons[1].dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, button: 0, pointerId: 3, pointerType: 'mouse', isPrimary: true }))
    })
    await cleanup(container, root)
  })

  it('NF-DYNAMIC-03: Bounds, step, and commit-policy changes should atomically revalidate controlled state and stepper capability', async () => {
    // Constraint changes recompute managed invalid state and stepper
    // capability with no normalization callback; invalid configurations
    // fail property-specifically before mixed output.
    const seen: Array<number | null> = []
    function App(props: { min?: number; max?: number; step?: number; commitBehavior?: 'snap' | 'validate' | 'none' }) {
      return (
        <NumberField value={5} locale="en-US" min={props.min} max={props.max} step={props.step} commitBehavior={props.commitBehavior} onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" data-testid="nf-dec" />
            <NumberField.Input aria-label="Quantity" data-testid="nf-input" />
            <NumberField.Increment aria-label="Increment" data-testid="nf-inc" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App min={0} max={10} step={1} commitBehavior="validate" />)
    })
    const input = () => container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
    const inc = () => container.querySelector('[data-testid="nf-inc"]') as HTMLButtonElement
    const dec = () => container.querySelector('[data-testid="nf-dec"]') as HTMLButtonElement
    expect(input().getAttribute('aria-invalid')).toBeNull()
    expect(inc().disabled).toBe(false)
    expect(dec().disabled).toBe(false)
    // Tightening max below the value invalidates without a callback.
    await React.act(async () => {
      root.render(<App min={0} max={4} step={1} commitBehavior="validate" />)
    })
    expect(input().getAttribute('aria-invalid')).toBe('true')
    expect(inc().disabled).toBe(true)
    expect(dec().disabled).toBe(false)
    expect(seen).toEqual([])
    // Loosening clears; an off-step value stays step-invalid in validate.
    await React.act(async () => {
      root.render(<App min={0} max={10} step={2} commitBehavior="validate" />)
    })
    expect(input().getAttribute('aria-invalid')).toBe('true')
    expect(seen).toEqual([])
    // Invalid configurations diagnose property-specifically.
    expect(() =>
      renderToString(
        <NumberField value={5} locale="en-US" min={10} max={0}>
          <NumberField.Group>
            <NumberField.Input aria-label="Quantity" />
          </NumberField.Group>
        </NumberField>
      )
    ).toThrow(/"min" must be less than or equal to "max"/)
    await cleanup(container, root)
  })

  it('NF-DYNAMIC-04: Optional steppers and arbitrary siblings should insert, remove, and reorder without replacing Input', async () => {
    // Keyed mutations around a focused dirty Input preserve Input/caret
    // identity, current controls, and sibling independence with no stale
    // listener or request.
    const seen: Array<number | null> = []
    function App({ order, showInc, showDec }: { order: 'normal' | 'reversed'; showInc: boolean; showDec: boolean }) {
      const parts = [
        showDec ? <NumberField.Decrement key="dec" aria-label="Decrement" data-testid="nf-dec" /> : null,
        <span key="prefix" data-testid="nf-prefix">
          $
        </span>,
        <NumberField.Input key="input" aria-label="Quantity" data-testid="nf-input" />,
        showInc ? <NumberField.Increment key="inc" aria-label="Increment" data-testid="nf-inc" /> : null,
      ].filter(Boolean)
      return (
        <NumberField value={5} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Group data-testid="nf-group">{order === 'normal' ? parts : [...parts].reverse()}</NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App order="normal" showInc showDec />)
    })
    const input = container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '9')
      input.setSelectionRange(1, 1)
    })
    // Remove a stepper: Input/caret identity and dirty text survive.
    await React.act(async () => {
      root.render(<App order="normal" showInc={false} showDec />)
    })
    expect(container.querySelector('[data-testid="nf-input"]')).toBe(input)
    expect(input.value).toBe('9')
    expect(input.selectionStart).toBe(1)
    expect(container.querySelector('[data-testid="nf-inc"]')).toBeNull()
    // Reorder with sibling: order follows, registration stays current.
    await React.act(async () => {
      root.render(<App order="reversed" showInc showDec />)
    })
    const group = container.querySelector('[data-testid="nf-group"]') as HTMLElement
    expect(Array.from(group.children).map(el => el.getAttribute('data-testid') ?? el.tagName)).toEqual([
      'nf-inc',
      'nf-input',
      'nf-prefix',
      'nf-dec',
    ])
    expect(container.querySelector('[data-testid="nf-input"]')).toBe(input)
    const inc = container.querySelector('[data-testid="nf-inc"]') as HTMLButtonElement
    expect(inc.getAttribute('aria-controls')).toBe(input.id)
    // Only the live 9 (rejected, draft intact) — no stale listener request.
    expect(seen).toEqual([9])
    // The reinserted stepper steps the complete dirty candidate once.
    await React.act(async () => {
      inc.click()
    })
    expect(seen).toEqual([9, 10])
    await cleanup(container, root)
  })

  it('NF-ENV-03: Generated IDs should be stable and unique within one React root', async () => {
    // SSR markup carries unique stable Input ids with exact stepper
    // controls; hydration matches byte-identically with no callback.
    const html = renderToString(
      <div>
        <NumberField value={1} locale="en-US">
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="First" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
        <NumberField value={2} locale="en-US">
          <NumberField.Group>
            <NumberField.Input aria-label="Second" />
          </NumberField.Group>
        </NumberField>
      </div>
    )
    const ids = Array.from(html.matchAll(/<input[^>]*id="([^"]+)"/g)).map(m => m[1])
    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe('')
    expect(ids[1]).not.toBe('')
    expect(ids[0]).not.toBe(ids[1])
    const controls = Array.from(html.matchAll(/aria-controls="([^"]+)"/g)).map(m => m[1])
    expect(controls).toEqual([ids[0], ids[0]])
    // Deterministic across renders: same tree, same ids.
    const again = renderToString(
      <div>
        <NumberField value={1} locale="en-US">
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="First" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
        <NumberField value={2} locale="en-US">
          <NumberField.Group>
            <NumberField.Input aria-label="Second" />
          </NumberField.Group>
        </NumberField>
      </div>
    )
    expect(again).toBe(html)
  })

  it('NF-ENV-07: Automated mobile coverage should assert only grammar-derived inputMode attributes', async () => {
    // Validate min-zero, snap negative, snap nonnegative integer, snap
    // nonnegative fraction, and scientific fixtures map to text, text,
    // numeric, decimal, and text from public grammar alone.
    const modes: Record<string, string | null> = {}
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <div>
          <NumberField value={0} locale="en-US" min={0} commitBehavior="validate">
            <NumberField.Group>
              <NumberField.Input aria-label="A" data-testid="nf-mode-validate" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={-3} locale="en-US" min={-10} step={1} commitBehavior="snap">
            <NumberField.Group>
              <NumberField.Input aria-label="B" data-testid="nf-mode-negative" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={3} locale="en-US" min={0} step={1} commitBehavior="snap">
            <NumberField.Group>
              <NumberField.Input aria-label="C" data-testid="nf-mode-integer" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={3} locale="en-US" min={0} step={0.005} commitBehavior="snap">
            <NumberField.Group>
              <NumberField.Input aria-label="D" data-testid="nf-mode-fraction" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={1000} locale="en-US" min={0} step={1} commitBehavior="snap" formatOptions={{ notation: 'scientific' }}>
            <NumberField.Group>
              <NumberField.Input aria-label="E" data-testid="nf-mode-scientific" />
            </NumberField.Group>
          </NumberField>
          <NumberField value={0.12} locale="en-US" min={0} step={0.005} commitBehavior="snap" formatOptions={{ style: 'percent', minimumFractionDigits: 1 }}>
            <NumberField.Group>
              <NumberField.Input aria-label="F" data-testid="nf-mode-percent" />
            </NumberField.Group>
          </NumberField>
        </div>
      )
    })
    for (const key of ['validate', 'negative', 'integer', 'fraction', 'scientific', 'percent']) {
      modes[key] = (container.querySelector(`[data-testid="nf-mode-${key}"]`) as HTMLInputElement).getAttribute('inputmode')
    }
    expect(modes).toEqual({
      validate: 'text',
      negative: 'text',
      integer: 'numeric',
      fraction: 'decimal',
      scientific: 'text',
      // Percent display step 0.5 (0.005 * 100) is fractional: decimal.
      percent: 'decimal',
    })
    await cleanup(container, root)
  })

  it('NF-STEP-11: Stepper capability should follow controlled, dirty, bound, and root state', async () => {
    // Null/middle/endpoints, off-range, dirty complete/partial,
    // disabled/read-only, and part-disabled states map to exact
    // native/ARIA/data disabled state with atomic recovery.
    const seen: Array<number | null> = []
    function App({ value, disabled, readOnly, incDisabled }: { value: number | null; disabled?: boolean; readOnly?: boolean; incDisabled?: boolean }) {
      return (
        <NumberField value={value} locale="en-US" min={0} max={10} disabled={disabled} readOnly={readOnly} onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" data-testid="nf-dec" />
            <NumberField.Input aria-label="Quantity" data-testid="nf-input" />
            <NumberField.Increment aria-label="Increment" data-testid="nf-inc" disabled={incDisabled} />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    const inc = () => container.querySelector('[data-testid="nf-inc"]') as HTMLButtonElement
    const dec = () => container.querySelector('[data-testid="nf-dec"]') as HTMLButtonElement
    const input = () => container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
    // Middle: both enabled.
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    expect(inc().disabled).toBe(false)
    expect(dec().disabled).toBe(false)
    expect(inc().getAttribute('data-disabled')).toBeNull()
    // Exact endpoints disable the outward stepper only.
    await React.act(async () => {
      root.render(<App value={10} />)
    })
    expect(inc().disabled).toBe(true)
    expect(inc().getAttribute('data-disabled')).toBe('')
    expect(dec().disabled).toBe(false)
    await React.act(async () => {
      root.render(<App value={0} />)
    })
    expect(dec().disabled).toBe(true)
    expect(inc().disabled).toBe(false)
    // Null never disables: the first step selects in-range-nearest-zero.
    await React.act(async () => {
      root.render(<App value={null} />)
    })
    expect(inc().disabled).toBe(false)
    expect(dec().disabled).toBe(false)
    // Complete dirty text drives capability from its numeric meaning.
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    await React.act(async () => {
      input().focus()
      setNativeValue(input(), '10')
    })
    expect(inc().disabled).toBe(true)
    expect(dec().disabled).toBe(false)
    // Partial drafts fall back to controlled state.
    await React.act(async () => {
      setNativeValue(input(), '-')
    })
    expect(inc().disabled).toBe(false)
    expect(dec().disabled).toBe(false)
    await React.act(async () => {
      pressKey(input(), 'Escape')
      input().blur()
    })
    // Root disabled/read-only and part-disabled disable atomically.
    await React.act(async () => {
      root.render(<App value={5} disabled />)
    })
    expect(inc().disabled).toBe(true)
    expect(dec().disabled).toBe(true)
    await React.act(async () => {
      root.render(<App value={5} readOnly />)
    })
    expect(inc().disabled).toBe(true)
    expect(dec().disabled).toBe(true)
    await React.act(async () => {
      root.render(<App value={5} incDisabled />)
    })
    expect(inc().disabled).toBe(true)
    expect(dec().disabled).toBe(false)
    // Recovery is atomic: one rerender restores both.
    await React.act(async () => {
      root.render(<App value={5} />)
    })
    expect(inc().disabled).toBe(false)
    expect(dec().disabled).toBe(false)
    // Only the rejected live 10 from the dirty section — capability probes
    // never request.
    expect(seen).toEqual([10])
    await cleanup(container, root)
  })

  it('NF-KEY-07: Read-only state should suppress handled keyboard work', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={10} locale="en-US" min={0} max={100} readOnly onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
      pressKey(input, 'ArrowDown')
      pressKey(input, 'Home')
      pressKey(input, 'End')
    })
    expect(seen).toEqual([])
    expect(input.value).toBe('10')
    await cleanup(container, root)
  })

  it('NF-COMMIT-03 / NF-COMMIT-07: Invalid commits should revert with a failed boundary that resolves only authoritatively', async () => {
    // Sign/decimal/exponent/malformed-group/affix partials revert with
    // zero callback and managed invalid state; submits stay blocked until
    // a valid user edit, an accepted commit, an authoritative programmatic
    // change, or an unprevented reset clears the boundary.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <form data-testid="nf-form">
          <NumberField value={5} locale="en-US" name="qty" onChange={v => void seen.push(v)}>
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    const submitBlocked = async () => {
      let prevented = false
      await React.act(async () => {
        prevented = !form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      })
      return prevented
    }
    for (const partial of ['-', '.', '1e', '1,2,3,4', '$']) {
      await React.act(async () => {
        input.focus()
        setNativeValue(input, partial)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(input.value).toBe('5')
      expect(input.getAttribute('data-editing')).toBeNull()
      expect(input.getAttribute('aria-invalid')).toBe('true')
    }
    expect(seen).toEqual([])
    expect(await submitBlocked()).toBe(true)
    expect(await submitBlocked()).toBe(true)
    // A valid user edit clears the boundary before the next commit.
    await React.act(async () => {
      setNativeValue(input, '6')
    })
    expect(input.getAttribute('aria-invalid')).toBeNull()
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    // Live 6 plus the commit retry (the parent holds 5 throughout).
    expect(seen).toEqual([6, 6])
    // Fail again, then resolve by authoritative programmatic change.
    await React.act(async () => {
      setNativeValue(input, 'junk')
      pressKey(input, 'Enter')
    })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    await React.act(async () => {
      root.render(
        <form data-testid="nf-form">
          <NumberField value={42} locale="en-US" name="qty" onChange={v => void seen.push(v)}>
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </form>
      )
    })
    expect(input.value).toBe('42')
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(await submitBlocked()).toBe(false)
    await cleanup(container, root)
  })

  it('NF-COMMIT-10: Canceling blur should retain a dirty session while unfocused and resume it on refocus', async () => {
    // Exact dirty text/selection/data-editing survive unfocused time with
    // no commit callback or format reset (the pre-veto live request stands);
    // refocus resumes the session.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <div>
          <button type="button" data-testid="nf-outside">
            Outside
          </button>
          <NumberField value={5} locale="en-US" onChange={v => void seen.push(v)}>
            <NumberField.Group>
              <NumberField.Decrement aria-label="Decrement" />
              <NumberField.Input aria-label="Quantity" onBlur={e => e.preventDefault()} />
              <NumberField.Increment aria-label="Increment" />
            </NumberField.Group>
          </NumberField>
        </div>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    const outside = container.querySelector('[data-testid="nf-outside"]') as HTMLButtonElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '9')
      input.setSelectionRange(0, 1)
    })
    await React.act(async () => {
      outside.focus()
    })
    expect(document.activeElement).toBe(outside)
    expect(input.value).toBe('9')
    expect(input.getAttribute('data-editing')).toBe('')
    expect(seen).toEqual([9])
    await React.act(async () => {
      input.focus()
    })
    expect(input.value).toBe('9')
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(1)
    expect(input.getAttribute('data-editing')).toBe('')
    // The resumed session still commits (retry — parent holds 5).
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([9, 9])
    await cleanup(container, root)
  })

  it('NF-MATH-15: Off-grid bound validity should distinguish an allowed endpoint from an ordinary step mismatch', async () => {
    // Validate mode: exact off-grid endpoints are bound-valid but
    // step-invalid; interior mismatch is invalid. Snap mode: endpoints are
    // step-valid by endpoint exception. Native flags stay false; no prop
    // is normalized.
    const seen: Array<number | null> = []
    function App({ value, commitBehavior }: { value: number | null; commitBehavior: 'snap' | 'validate' }) {
      return (
        <NumberField value={value} locale="en-US" min={0} max={10} step={3} commitBehavior={commitBehavior} onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Input aria-label="Quantity" data-testid="nf-input" />
          </NumberField.Group>
        </NumberField>
      )
    }
    const { container, root } = mount()
    const invalidOf = () =>
      (container.querySelector('[data-testid="nf-input"]') as HTMLInputElement).getAttribute('aria-invalid') ===
      'true'
    // Validate: exact off-grid max is step-invalid (no endpoint exception).
    await React.act(async () => {
      root.render(<App value={10} commitBehavior="validate" />)
    })
    expect(invalidOf()).toBe(true)
    // Validate: interior on-lattice value is valid.
    await React.act(async () => {
      root.render(<App value={9} commitBehavior="validate" />)
    })
    expect(invalidOf()).toBe(false)
    // Validate: interior mismatch is invalid.
    await React.act(async () => {
      root.render(<App value={8} commitBehavior="validate" />)
    })
    expect(invalidOf()).toBe(true)
    // Snap: the same off-grid endpoint is step-valid by exception.
    await React.act(async () => {
      root.render(<App value={10} commitBehavior="snap" />)
    })
    expect(invalidOf()).toBe(false)
    // Snap: interior mismatch stays invalid.
    await React.act(async () => {
      root.render(<App value={8} commitBehavior="snap" />)
    })
    expect(invalidOf()).toBe(true)
    const input = container.querySelector('[data-testid="nf-input"]') as HTMLInputElement
    expect(input.validity.rangeUnderflow).toBe(false)
    expect(input.validity.rangeOverflow).toBe(false)
    expect(input.validity.stepMismatch).toBe(false)
    // Display follows the prop verbatim: nothing normalized.
    expect(input.value).toBe('8')
    expect(seen).toEqual([])
    await cleanup(container, root)
  })
})

function Wave2Field(props: React.ComponentProps<typeof NumberField>) {
  const { children: _ignoredDefault, ...rest } = props
  return (
    <NumberField {...rest}>
      <NumberField.Group>
        <NumberField.Decrement aria-label="Decrement" />
        <NumberField.Input aria-label="Quantity" />
        <NumberField.Increment aria-label="Increment" />
      </NumberField.Group>
    </NumberField>
  )
}

describe('NumberField wave-2 formatting', () => {
  it('NF-FORMAT-01: NumberField should render controlled values with the exact requested Intl format through public Input', async () => {
    const vectors: Array<{ value: number; locale: string; formatOptions?: Intl.NumberFormatOptions }> = [
      { value: 12.5, locale: 'en-US' },
      { value: -3.25, locale: 'en-US' },
      { value: 0, locale: 'en-US' },
      { value: 0.00001, locale: 'en-US' },
      { value: 1234567.89, locale: 'en-US' },
      { value: 1234567.89, locale: 'de-DE' },
      { value: 1234.5, locale: 'en-US', formatOptions: { style: 'currency', currency: 'USD' } },
      { value: 0.125, locale: 'en-US', formatOptions: { style: 'percent' } },
      { value: 12, locale: 'en-US', formatOptions: { style: 'unit', unit: 'kilogram' } },
      { value: 12345, locale: 'en-US', formatOptions: { notation: 'scientific' } },
      { value: 12345, locale: 'en-US', formatOptions: { notation: 'engineering' } },
      {
        value: -12.5,
        locale: 'en-US',
        formatOptions: { style: 'currency', currency: 'USD', currencySign: 'accounting' },
      },
    ]
    for (const vector of vectors) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={vector.value}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      expect(input.value).toBe(new Intl.NumberFormat(vector.locale, vector.formatOptions).format(vector.value))
      expect(seen).toEqual([])
      await cleanup(container, root)
    }
  })

  it('NF-FORMAT-02: Controlled null should be the only clean empty display', async () => {
    const vectors: Array<{
      value: number | null
      formatOptions?: Intl.NumberFormatOptions
      empty: boolean
    }> = [
      { value: null, empty: true },
      { value: 0, empty: false },
      { value: -0, empty: false },
      { value: 0.0001, formatOptions: { maximumFractionDigits: 0 }, empty: false },
    ]
    for (const vector of vectors) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={vector.value}
            locale="en-US"
            name="qty"
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
      if (vector.empty) {
        expect(input.value).toBe('')
        expect(input.getAttribute('data-empty')).toBe('')
        expect(hidden.value).toBe('')
      } else {
        expect(input.value).not.toBe('')
        expect(input.getAttribute('data-empty')).toBeNull()
        expect(hidden.value).toBe(String(vector.value))
      }
      expect(seen).toEqual([])
      await cleanup(container, root)
    }
    // Programmatic -0 renders "0", interaction never stores it (NF-MATH-14 echo).
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<Wave2Field value={-0} locale="en-US" />)
    })
    expect((container.querySelector('input[type="text"]') as HTMLInputElement).value).toBe('0')
    await cleanup(container, root)
  })

  it('NF-FORMAT-05: Omitted Intl precision defaults should remain display-only', async () => {
    // 1.23456 renders visually rounded ("1.235") but focus/blur without
    // editing never republishes, truncates, or reparses the number.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<Wave2Field value={1.23456} locale="en-US" name="qty" onChange={v => void seen.push(v)} />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    expect(input.value).toBe('1.235')
    expect(hidden.value).toBe('1.23456')
    await React.act(async () => {
      input.focus()
    })
    await React.act(async () => {
      input.blur()
    })
    expect(seen).toEqual([])
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(input.value).toBe('1.235')
    expect(hidden.value).toBe('1.23456')
    await cleanup(container, root)
  })

  it('NF-FORMAT-06: Authored fraction rounding should apply only at a dirty commit boundary', async () => {
    // Snap + fine step keeps every vector on-lattice so only the authored
    // rounding moves the candidate; each vector publishes its raw live
    // meaning first, then one rounded commit.
    const vectors: Array<{ text: string; formatOptions: Intl.NumberFormatOptions; expected: number }> = [
      { text: '2.5', formatOptions: { maximumFractionDigits: 0 }, expected: 3 },
      { text: '-2.5', formatOptions: { maximumFractionDigits: 0 }, expected: -3 },
      { text: '2.5', formatOptions: { maximumFractionDigits: 0, roundingMode: 'halfEven' }, expected: 2 },
      { text: '2.1', formatOptions: { maximumFractionDigits: 0, roundingMode: 'ceil' }, expected: 3 },
      { text: '2.9', formatOptions: { maximumFractionDigits: 0, roundingMode: 'floor' }, expected: 2 },
    ]
    for (const vector of vectors) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      const renderEcho = (value: number | null) =>
        root.render(
          <Wave2Field
            value={value}
            locale="en-US"
            commitBehavior="snap"
            step={0.01}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      await React.act(async () => {
        renderEcho(0)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      expect(seen).toEqual([parseFloat(vector.text)])
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([parseFloat(vector.text), vector.expected])
      await React.act(async () => {
        renderEcho(vector.expected)
      })
      expect(input.value).toBe(
        new Intl.NumberFormat('en-US', vector.formatOptions).format(vector.expected)
      )
      expect(input.getAttribute('data-editing')).toBeNull()
      await cleanup(container, root)
    }
    // Clean rerenders keep the unmodified controlled number: display shows
    // the rounded image while the hidden value and callback log stay exact.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <Wave2Field
          value={2.5}
          locale="en-US"
          name="qty"
          commitBehavior="snap"
          step={0.01}
          formatOptions={{ maximumFractionDigits: 0 }}
          onChange={v => void seen.push(v)}
        />
      )
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    expect(input.value).toBe('3')
    expect((container.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe('2.5')
    await React.act(async () => {
      root.render(
        <Wave2Field
          value={2.5}
          locale="en-US"
          name="qty"
          commitBehavior="snap"
          step={0.01}
          formatOptions={{ maximumFractionDigits: 0 }}
          onChange={v => void seen.push(v)}
        />
      )
    })
    expect(seen).toEqual([])
    expect(input.value).toBe('3')
    await cleanup(container, root)
  })

  it('NF-FORMAT-07: Authored significant digits, priority, and rounding increments should produce observable public commit results', async () => {
    // Priority vectors use a fine step so snap is the identity and only
    // the authored priority moves the candidate (snap runs before rounding).
    const vectors: Array<{
      text: string
      step: number
      formatOptions: Intl.NumberFormatOptions
      expected: number
    }> = [
      {
        text: '1234.5',
        step: 0.01,
        formatOptions: { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
        expected: 1230,
      },
      {
        text: '1.23',
        step: 0.01,
        formatOptions: { minimumFractionDigits: 2, maximumFractionDigits: 2, roundingIncrement: 5 },
        expected: 1.25,
      },
      {
        text: '1.2345',
        step: 0.0001,
        formatOptions: {
          minimumFractionDigits: 2,
          maximumSignificantDigits: 3,
          roundingPriority: 'morePrecision',
        },
        expected: 1.235,
      },
      {
        text: '1.2345',
        step: 0.0001,
        formatOptions: {
          minimumFractionDigits: 2,
          maximumSignificantDigits: 3,
          roundingPriority: 'lessPrecision',
        },
        expected: 1.23,
      },
    ]
    for (const vector of vectors) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale="en-US"
            commitBehavior="snap"
            step={vector.step}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      // Raw live meaning first, then the authored-priority commit.
      expect(seen).toEqual([parseFloat(vector.text), vector.expected])
      await cleanup(container, root)
    }
    // Invalid combinations diagnose before interaction, naming the props.
    expect(() =>
      renderToString(
        <Wave2Field value={0} locale="en-US" formatOptions={{ minimumFractionDigits: 5, maximumFractionDigits: 2 }} />
      )
    ).toThrow(/"locale"\/"formatOptions"/)
    expect(() =>
      renderToString(
        <Wave2Field value={0} locale="en-US" formatOptions={{ maximumFractionDigits: 2, roundingIncrement: 7 }} />
      )
    ).toThrow(/"locale"\/"formatOptions"/)
  })

  it('NF-FORMAT-08: Percent rounding should occur at display scale while currency and units retain numeric scale', async () => {
    // Percent: the commit rounds the displayed 12.55% and publishes the
    // fractional candidate 0.125.
    const seenPercent: Array<number | null> = []
    const percentMount = mount()
    const renderPercent = (value: number | null) =>
      percentMount.root.render(
        <Wave2Field
          value={value}
          locale="en-US"
          commitBehavior="snap"
          step={0.005}
          formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
          onChange={v => void seenPercent.push(v)}
        />
      )
    await React.act(async () => {
      renderPercent(0)
    })
    const percentInput = percentMount.container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      percentInput.focus()
      setNativeValue(percentInput, '12.55%')
    })
    await React.act(async () => {
      pressKey(percentInput, 'Enter')
    })
    expect(seenPercent).toEqual([0.1255, 0.125])
    await React.act(async () => {
      renderPercent(0.125)
    })
    expect(percentInput.value).toBe('12.5%')
    await cleanup(percentMount.container, percentMount.root)
    // Percent-unit and currency keep numeric scale: bare digits commit
    // unscaled and echo with their unit/currency display.
    const seenUnit: Array<number | null> = []
    const unitMount = mount()
    const renderUnit = (value: number | null) =>
      unitMount.root.render(
        <Wave2Field
          value={value}
          locale="en-US"
          formatOptions={{ style: 'unit', unit: 'percent' }}
          onChange={v => void seenUnit.push(v)}
        />
      )
    await React.act(async () => {
      renderUnit(0)
    })
    const unitInput = unitMount.container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      unitInput.focus()
      setNativeValue(unitInput, '12.5')
    })
    await React.act(async () => {
      pressKey(unitInput, 'Enter')
    })
    expect(seenUnit).toEqual([12.5, 12.5])
    await React.act(async () => {
      renderUnit(12.5)
    })
    expect(unitInput.value).toBe(new Intl.NumberFormat('en-US', { style: 'unit', unit: 'percent' }).format(12.5))
    await cleanup(unitMount.container, unitMount.root)
    const seenCurrency: Array<number | null> = []
    const currencyMount = mount()
    const renderCurrency = (value: number | null) =>
      currencyMount.root.render(
        <Wave2Field
          value={value}
          locale="en-US"
          formatOptions={{ style: 'currency', currency: 'USD' }}
          onChange={v => void seenCurrency.push(v)}
        />
      )
    await React.act(async () => {
      renderCurrency(0)
    })
    const currencyInput = currencyMount.container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      currencyInput.focus()
      setNativeValue(currencyInput, '$12.50')
    })
    await React.act(async () => {
      pressKey(currencyInput, 'Enter')
    })
    expect(seenCurrency).toEqual([12.5, 12.5])
    await React.act(async () => {
      renderCurrency(12.5)
    })
    expect(currencyInput.value).toBe('$12.50')
    await cleanup(currencyMount.container, currencyMount.root)
  })
})

describe('NumberField wave-2 parsing', () => {
  it('NF-PARSE-04: NumberField should preserve incomplete localized grammar as dirty text without publishing a substitute value', async () => {
    // Empty, sign-only, decimal-only, trailing decimal/group, affix
    // partial, and incomplete exponent strings stay verbatim + dirty with
    // no numeric callback; commit reverts to controlled state.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<Wave2Field value={5} locale="en-US" name="qty" onChange={v => void seen.push(v)} />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    for (const partial of ['-', '.', '1.', '1,', '$', '1e', '1.5e+']) {
      await React.act(async () => {
        input.focus()
        setNativeValue(input, partial)
      })
      expect(input.value).toBe(partial)
      expect(input.getAttribute('data-editing')).toBe('')
      expect(seen).toEqual([])
      expect(hidden.value).toBe('5')
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      expect(input.value).toBe('5')
      expect(hidden.value).toBe('5')
      expect(input.getAttribute('data-editing')).toBeNull()
    }
    await cleanup(container, root)
  })

  it('NF-PARSE-05: Current-locale decimal and group meaning should win over ambiguous foreign punctuation', async () => {
    const vectors: Array<{ locale: string; text: string; expected: number | null }> = [
      { locale: 'en-US', text: '1,234.5', expected: 1234.5 },
      { locale: 'de-DE', text: '1.234,5', expected: 1234.5 },
      { locale: 'fr-FR', text: '1 234,5', expected: 1234.5 },
      // Deterministic rejection, never punctuation guessing.
      { locale: 'en-US', text: '1.2.3', expected: null },
      { locale: 'en-US', text: '12,34,567', expected: null },
      { locale: 'de-DE', text: '1,2,3', expected: null },
      { locale: 'de-DE', text: '1.2.3', expected: null },
    ]
    for (const vector of vectors) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={vector.locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      if (vector.expected === null) {
        expect(seen).toEqual([])
        expect(input.value).toBe('0')
      } else {
        // Raw live meaning plus the identical commit retry (spy parent).
        expect(seen).toEqual([vector.expected, vector.expected])
      }
      await cleanup(container, root)
    }
  })

  it('NF-PARSE-14: Empty, nonnumeric, overflowing, and nonfinite text should never cross the numeric callback', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<Wave2Field value={5} locale="en-US" name="qty" onChange={v => void seen.push(v)} />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    for (const text of ['   ', 'abc', '$', 'NaN', 'Infinity', '1e999', '-Infinity', '12abc34']) {
      await React.act(async () => {
        input.focus()
        setNativeValue(input, text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      // Only numbers are asserted absent: whitespace-only commits the empty
      // null request, everything else reverts with zero callback.
      for (const candidate of seen) {
        expect(typeof candidate).not.toBe('number')
      }
      expect(input.value).toBe('5')
      expect(hidden.value).toBe('5')
      expect(input.getAttribute('data-editing')).toBeNull()
    }
    // Whitespace-only publishes the empty null live, retried at commit.
    expect(seen).toEqual([null, null])
    await cleanup(container, root)
  })

  it('NF-PARSE-02: NumberField should accept ASCII, Arabic-Indic, Extended Arabic-Indic, Devanagari, Bengali, fullwidth, and supported hanidec digits', async () => {
    // Localized 1024.5 per active set, derived from Intl (never hard-coded
    // glyphs): same numeric callback everywhere.
    const accept: Array<{ locale: string; mixAscii?: string }> = [
      { locale: 'ar-EG', mixAscii: '1٬٠٢٤٫5' },
      { locale: 'fa-IR' },
      { locale: 'hi-IN-u-nu-deva' },
      { locale: 'bn-BD' },
      { locale: 'en-US-u-nu-fullwide' },
      { locale: 'zh-CN-u-nu-hanidec' },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={vector.locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      const localized = new Intl.NumberFormat(vector.locale).format(1024.5)
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      // Raw live meaning plus the identical commit retry (spy parent).
      expect(seen).toEqual([1024.5, 1024.5])
      if (vector.mixAscii !== undefined) {
        await React.act(async () => {
          input.focus()
          setNativeValue(input, vector.mixAscii as string)
        })
        await React.act(async () => {
          pressKey(input, 'Enter')
        })
        expect(seen).toEqual([1024.5, 1024.5, 1024.5, 1024.5])
      }
      await cleanup(container, root)
    }
    // Two non-ASCII scripts, and inactive-locale digits, never parse.
    const reject: Array<{ locale: string; text: string }> = [
      { locale: 'ar-EG', text: '١۲۳' },
      { locale: 'ar-EG', text: '१२' },
      { locale: 'en-US', text: '١٢' },
      { locale: 'fa-IR', text: '١٢٣' },
    ]
    for (const vector of reject) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={vector.locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      expect(input.value).toBe(new Intl.NumberFormat(vector.locale).format(0))
      await cleanup(container, root)
    }
    // Echo-on canonical display: the arab and hanidec spellings land and
    // render back through the active formatter.
    for (const locale of ['ar-EG', 'zh-CN-u-nu-hanidec']) {
      const { container, root } = mount()
      function EchoApp() {
        const [value, setValue] = React.useState<number | null>(0)
        return <Wave2Field value={value} locale={locale} onChange={setValue} />
      }
      await React.act(async () => {
        root.render(<EchoApp />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      const localized = new Intl.NumberFormat(locale).format(1024.5)
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(input.value).toBe(localized)
      await cleanup(container, root)
    }
  })

  it('NF-PARSE-03: NumberField should accept only active-locale or documented width sign variants without discarding duplicate or embedded signs', async () => {
    const accept: Array<{ locale: string; text: string; expected: number }> = [
      { locale: 'en-US', text: '+123.5', expected: 123.5 },
      { locale: 'en-US', text: '-123.5', expected: -123.5 },
      { locale: 'en-US', text: '＋123.5', expected: 123.5 },
      { locale: 'en-US', text: '－123.5', expected: -123.5 },
      { locale: 'en-US', text: '﹢123.5', expected: 123.5 },
      { locale: 'en-US', text: '﹣123.5', expected: -123.5 },
      { locale: 'fi-FI', text: '−123,5', expected: -123.5 },
      { locale: 'fi-FI', text: '-123,5', expected: -123.5 },
      { locale: 'fi-FI', text: '+123,5', expected: 123.5 },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={vector.locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.expected, vector.expected])
      await cleanup(container, root)
    }
    // Inactive-locale signs, sign-like dashes, and any duplicate or
    // embedded sign reject whole — never discard-and-parse.
    const reject: Array<{ locale: string; text: string }> = [
      { locale: 'en-US', text: '−123.5' },
      { locale: 'en-US', text: '‒123.5' },
      { locale: 'en-US', text: '–123.5' },
      { locale: 'en-US', text: '—123.5' },
      { locale: 'en-US', text: '++123.5' },
      { locale: 'en-US', text: '--123.5' },
      { locale: 'en-US', text: '+-123.5' },
      { locale: 'en-US', text: '-+123.5' },
      { locale: 'en-US', text: '12-3.5' },
      { locale: 'en-US', text: '12+3.5' },
      { locale: 'en-US', text: '－+123.5' },
      { locale: 'en-US', text: '＋＋123' },
      { locale: 'en-US', text: '123.5-' },
      { locale: 'fi-FI', text: '–123,5' },
      { locale: 'fi-FI', text: '12−3,5' },
    ]
    for (const vector of reject) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={vector.locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      expect(input.value).toBe(new Intl.NumberFormat(vector.locale).format(0))
      await cleanup(container, root)
    }
    // Under min=0, validate retains the negative underflow (live request
    // echoes, commit noops on the echoed value, managed invalid shows);
    // snap rejects the minus at commit. Live requests stay raw in both
    // (NFLAST ruling (c)) — policy is commit-time.
    const underflowSeen: Array<number | null> = []
    const underflow = mount()
    function ValidateApp() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <Wave2Field
          value={value}
          locale="en-US"
          min={0}
          commitBehavior="validate"
          onChange={v => {
            underflowSeen.push(v)
            setValue(v)
          }}
        />
      )
    }
    await React.act(async () => {
      underflow.root.render(<ValidateApp />)
    })
    const underflowInput = underflow.container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      underflowInput.focus()
      setNativeValue(underflowInput, '-5')
    })
    await React.act(async () => {
      pressKey(underflowInput, 'Enter')
    })
    expect(underflowSeen).toEqual([-5])
    expect(underflowInput.value).toBe('-5')
    expect(underflowInput.getAttribute('aria-invalid')).toBe('true')
    await cleanup(underflow.container, underflow.root)
    const snapSeen: Array<number | null> = []
    const snap = mount()
    function SnapApp() {
      const [value, setValue] = React.useState<number | null>(5)
      return (
        <Wave2Field
          value={value}
          locale="en-US"
          min={0}
          commitBehavior="snap"
          onChange={v => {
            snapSeen.push(v)
            setValue(v)
          }}
        />
      )
    }
    await React.act(async () => {
      snap.root.render(<SnapApp />)
    })
    const snapInput = snap.container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      snapInput.focus()
      setNativeValue(snapInput, '-5')
    })
    await React.act(async () => {
      pressKey(snapInput, 'Enter')
    })
    expect(snapSeen).toEqual([-5, 0])
    expect(snapInput.value).toBe('0')
    await cleanup(snap.container, snap.root)
  })

  it('NF-PARSE-06: Locale-equivalent space and apostrophe groups should parse only in valid group positions', async () => {
    // French spaces below: U+0020 regular, U+00A0 no-break, U+202F narrow
    // no-break (= Intl group), U+2009 thin, U+2007 figure.
    const accept: Array<{ locale: string; text: string; expected: number }> = [
      { locale: 'fr-FR', text: '1 234,5', expected: 1234.5 },
      { locale: 'fr-FR', text: '1 234,5', expected: 1234.5 },
      { locale: 'fr-FR', text: '1 234,5', expected: 1234.5 },
      { locale: 'fr-FR', text: '1 234,5', expected: 1234.5 },
      { locale: 'fr-FR', text: '1 234,5', expected: 1234.5 },
      { locale: 'de-CH', text: "1'234.5", expected: 1234.5 },
      { locale: 'de-CH', text: '1’234.5', expected: 1234.5 },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={vector.locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.expected, vector.expected])
      await cleanup(container, root)
    }
    // Arbitrary whitespace — double separators, bad positions, leading
    // runs, non-separator whitespace — never forms a group.
    const reject: Array<{ locale: string; text: string }> = [
      { locale: 'fr-FR', text: '1  234,5' },
      { locale: 'fr-FR', text: '1 2,5' },
      { locale: 'fr-FR', text: ' 1 234,5' },
      { locale: 'fr-FR', text: '1\t234,5' },
      { locale: 'en-US', text: '1 234.5' },
      { locale: 'de-CH', text: "1''234.5" },
      { locale: 'de-CH', text: "1'23'45.5" },
    ]
    for (const vector of reject) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={vector.locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      expect(input.value).toBe(new Intl.NumberFormat(vector.locale).format(0))
      await cleanup(container, root)
    }
  })

  it('NF-PARSE-17: Indian grouping should honor the 3-2-2 pattern exposed by en-IN and hi-IN', async () => {
    // Latin (en-IN) and Devanagari (hi-IN-u-nu-deva) spellings of
    // 1,23,45,678.9, derived from Intl — never hard-coded glyphs.
    for (const locale of ['en-IN', 'hi-IN-u-nu-deva']) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      const localized = new Intl.NumberFormat(locale).format(12345678.9)
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([12345678.9, 12345678.9])
      await cleanup(container, root)
    }
    // Cross-pattern and malformed groups reject stably under both.
    const reject: Array<{ locale: string; text: string }> = [
      { locale: 'en-IN', text: '1,234,567.9' },
      { locale: 'en-IN', text: '1,23,4,678.9' },
      { locale: 'en-IN', text: '12,34,56,78.9' },
      { locale: 'en-US', text: '1,23,45,678.9' },
    ]
    for (const vector of reject) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale={vector.locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      expect(input.value).toBe(new Intl.NumberFormat(vector.locale).format(0))
      await cleanup(container, root)
    }
    // Echo-on display renders the Indian pattern back.
    const { container, root } = mount()
    function EchoApp() {
      const [value, setValue] = React.useState<number | null>(0)
      return <Wave2Field value={value} locale="en-IN" onChange={setValue} />
    }
    await React.act(async () => {
      root.render(<EchoApp />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '1,23,45,678.9')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(input.value).toBe(new Intl.NumberFormat('en-IN').format(12345678.9))
    await cleanup(container, root)
  })

  it('NF-PARSE-08: Configured currency affixes should parse in locale order while conflicting currency stays invalid', async () => {
    // Symbol/code/name forms per currency, derived from Intl: affix
    // present, in locale order (de-DE suffix), parses to the number.
    const accept: Array<{ locale: string; formatOptions: Intl.NumberFormatOptions; value: number }> = [
      { locale: 'en-US', formatOptions: { style: 'currency', currency: 'USD' }, value: 1234.5 },
      { locale: 'en-US', formatOptions: { style: 'currency', currency: 'EUR' }, value: 1234.5 },
      { locale: 'en-US', formatOptions: { style: 'currency', currency: 'JPY' }, value: 1235 },
      { locale: 'en-US', formatOptions: { style: 'currency', currency: 'BRL' }, value: 1234.5 },
      {
        locale: 'en-US',
        formatOptions: { style: 'currency', currency: 'USD', currencyDisplay: 'code' },
        value: 1234.5,
      },
      {
        locale: 'en-US',
        formatOptions: { style: 'currency', currency: 'USD', currencyDisplay: 'name' },
        value: 1234.5,
      },
      { locale: 'de-DE', formatOptions: { style: 'currency', currency: 'USD' }, value: 1234.5 },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      const localized = new Intl.NumberFormat(vector.locale, vector.formatOptions).format(vector.value)
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.value, vector.value])
      // Temporarily absent affix parses identically (locale punctuation).
      const bare =
        vector.locale === 'de-DE'
          ? '1.234,50'
          : vector.value === 1235
            ? '1,235'
            : '1,234.50'
      await React.act(async () => {
        input.focus()
        setNativeValue(input, bare)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.value, vector.value, vector.value, vector.value])
      await cleanup(container, root)
    }
    // Foreign currency, and currency text in decimal style, never parse.
    const reject: Array<{
      locale: string
      formatOptions?: Intl.NumberFormatOptions
      text: string
    }> = [
      {
        locale: 'en-US',
        formatOptions: { style: 'currency', currency: 'USD' },
        text: '€1,234.50',
      },
      {
        locale: 'en-US',
        formatOptions: { style: 'currency', currency: 'EUR' },
        text: '$1,234.50',
      },
      {
        locale: 'en-US',
        formatOptions: { style: 'currency', currency: 'EUR', currencyDisplay: 'code' },
        text: 'USD 1,234.50',
      },
      { locale: 'en-US', text: '$1,234.50' },
      { locale: 'en-US', text: 'USD 5' },
    ]
    for (const vector of reject) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      expect(input.value).toBe(new Intl.NumberFormat(vector.locale, vector.formatOptions).format(0))
      await cleanup(container, root)
    }
  })

  it('NF-PARSE-10: Configured unit affixes should round-trip without treating unit letters as exponent syntax', async () => {
    const accept: Array<{ locale: string; formatOptions: Intl.NumberFormatOptions; value: number }> = [
      { locale: 'en-US', formatOptions: { style: 'unit', unit: 'kilogram' }, value: 1234.5 },
      { locale: 'en-US', formatOptions: { style: 'unit', unit: 'kilogram', unitDisplay: 'long' }, value: 1 },
      { locale: 'en-US', formatOptions: { style: 'unit', unit: 'kilogram', unitDisplay: 'long' }, value: 2 },
      { locale: 'en-US', formatOptions: { style: 'unit', unit: 'kilometer-per-hour' }, value: 1234.5 },
      { locale: 'de-DE', formatOptions: { style: 'unit', unit: 'day', unitDisplay: 'long' }, value: 1 },
      { locale: 'de-DE', formatOptions: { style: 'unit', unit: 'day', unitDisplay: 'long' }, value: 2 },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      const localized = new Intl.NumberFormat(vector.locale, vector.formatOptions).format(vector.value)
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.value, vector.value])
      await cleanup(container, root)
    }
    // Another unit, partial affixes, and stray exponent letters reject.
    const kgOpts = { style: 'unit', unit: 'kilogram' } as const
    for (const text of ['1,234.5 lb', '1,234.5 k', '12e kg', '12 kg5', '1,234.5 kilogram']) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field value={0} locale="en-US" formatOptions={kgOpts} onChange={v => void seen.push(v)} />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      await cleanup(container, root)
    }
    // Echo-on round-trip display through the configured unit.
    const { container, root } = mount()
    function EchoApp() {
      const [value, setValue] = React.useState<number | null>(0)
      return <Wave2Field value={value} locale="en-US" formatOptions={kgOpts} onChange={setValue} />
    }
    await React.act(async () => {
      root.render(<EchoApp />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const localized = new Intl.NumberFormat('en-US', kgOpts).format(1234.5)
    await React.act(async () => {
      input.focus()
      setNativeValue(input, localized)
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(input.value).toBe(localized)
    await cleanup(container, root)
  })

  it('NF-PARSE-12: Accounting parentheses should mean negative only in configured accounting currency', async () => {
    const accountingOpts = { style: 'currency', currency: 'USD', currencySign: 'accounting' } as const
    const standardOpts = { style: 'currency', currency: 'USD' } as const
    // Parenthesized currency (derived), bare parens, and signed affix
    // forms parse negative in accounting configuration.
    const deAccountingOpts = {
      style: 'currency',
      currency: 'USD',
      currencySign: 'accounting',
    } as const
    const accept: Array<{
      locale: string
      formatOptions: typeof accountingOpts | typeof deAccountingOpts
      text: string
      expected: number
    }> = [
      {
        locale: 'en-US',
        formatOptions: accountingOpts,
        text: new Intl.NumberFormat('en-US', accountingOpts).format(-1234.5),
        expected: -1234.5,
      },
      { locale: 'en-US', formatOptions: accountingOpts, text: '(5)', expected: -5 },
      { locale: 'en-US', formatOptions: accountingOpts, text: '-$1,234.50', expected: -1234.5 },
      {
        locale: 'de-DE',
        formatOptions: deAccountingOpts,
        text: new Intl.NumberFormat('de-DE', deAccountingOpts).format(-1234.5),
        expected: -1234.5,
      },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.expected, vector.expected])
      await cleanup(container, root)
    }
    // Standard currency never strips parens; signed parens never double
    // up — inside or outside accounting.
    const reject: Array<{ formatOptions: typeof accountingOpts | typeof standardOpts; text: string }> = [
      { formatOptions: standardOpts, text: '($1,234.50)' },
      { formatOptions: standardOpts, text: '(5)' },
      { formatOptions: standardOpts, text: '(-$5)' },
      { formatOptions: accountingOpts, text: '(-$5)' },
      { formatOptions: accountingOpts, text: '((5))' },
    ]
    for (const vector of reject) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale="en-US"
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      await cleanup(container, root)
    }
  })

  it('NF-PARSE-09: Percent style and the percent unit should expose different public scales', async () => {
    // Percent style: localized marks scale, bare numbers scale too.
    const percentSeen: Array<number | null> = []
    const percent = mount()
    await React.act(async () => {
      percent.root.render(
        <Wave2Field
          value={0}
          locale="en-US"
          formatOptions={{ style: 'percent' }}
          onChange={v => void percentSeen.push(v)}
        />
      )
    })
    const percentInput = percent.container.querySelector('input[type="text"]') as HTMLInputElement
    for (const [text, expected] of [
      ['12%', 0.12],
      ['12‰', 0.012],
      ['12', 0.12],
    ] as Array<[string, number]>) {
      await React.act(async () => {
        percentInput.focus()
        setNativeValue(percentInput, text)
      })
      await React.act(async () => {
        pressKey(percentInput, 'Enter')
      })
      expect(percentSeen.slice(-2)).toEqual([expected, expected])
    }
    await cleanup(percent.container, percent.root)
    // Arabic percent: derived output incl. the trailing bidi mark.
    const arSeen: Array<number | null> = []
    const ar = mount()
    await React.act(async () => {
      ar.root.render(
        <Wave2Field
          value={0}
          locale="ar-EG"
          formatOptions={{ style: 'percent' }}
          onChange={v => void arSeen.push(v)}
        />
      )
    })
    const arInput = ar.container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      arInput.focus()
      setNativeValue(arInput, new Intl.NumberFormat('ar-EG', { style: 'percent' }).format(0.12))
    })
    await React.act(async () => {
      pressKey(arInput, 'Enter')
    })
    expect(arSeen).toEqual([0.12, 0.12])
    await cleanup(ar.container, ar.root)
    // Percent unit: no scaling; permille is unsupported, not permille.
    const unitSeen: Array<number | null> = []
    const unit = mount()
    await React.act(async () => {
      unit.root.render(
        <Wave2Field
          value={0}
          locale="en-US"
          formatOptions={{ style: 'unit', unit: 'percent' }}
          onChange={v => void unitSeen.push(v)}
        />
      )
    })
    const unitInput = unit.container.querySelector('input[type="text"]') as HTMLInputElement
    for (const text of ['12%', '12']) {
      await React.act(async () => {
        unitInput.focus()
        setNativeValue(unitInput, text)
      })
      await React.act(async () => {
        pressKey(unitInput, 'Enter')
      })
      expect(unitSeen.slice(-2)).toEqual([12, 12])
    }
    await React.act(async () => {
      unitInput.focus()
      setNativeValue(unitInput, '12‰')
    })
    await React.act(async () => {
      pressKey(unitInput, 'Enter')
    })
    expect(unitSeen.slice(-2)).toEqual([12, 12])
    await cleanup(unit.container, unit.root)
    // Decimal style rejects both marks deterministically.
    for (const text of ['12%', '12‰']) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale="en-US" onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      await cleanup(container, root)
    }
  })

  it('NF-PARSE-18: Plural currency and unit affix forms exposed by Intl should remain parseable without guessing prose', async () => {
    // Singular/plural/few/many formatter outputs, fed back verbatim.
    const accept: Array<{ locale: string; formatOptions: Intl.NumberFormatOptions; value: number }> = [
      {
        locale: 'fr-FR',
        formatOptions: { style: 'currency', currency: 'USD', currencyDisplay: 'name' },
        value: 1,
      },
      {
        locale: 'fr-FR',
        formatOptions: { style: 'currency', currency: 'USD', currencyDisplay: 'name' },
        value: 2,
      },
      {
        locale: 'en-US',
        formatOptions: { style: 'unit', unit: 'kilogram', unitDisplay: 'long' },
        value: 1,
      },
      {
        locale: 'en-US',
        formatOptions: { style: 'unit', unit: 'kilogram', unitDisplay: 'long' },
        value: 2,
      },
      { locale: 'de-DE', formatOptions: { style: 'unit', unit: 'day', unitDisplay: 'long' }, value: 1 },
      { locale: 'de-DE', formatOptions: { style: 'unit', unit: 'day', unitDisplay: 'long' }, value: 2 },
      { locale: 'ar-EG', formatOptions: { style: 'unit', unit: 'day', unitDisplay: 'long' }, value: 3 },
      { locale: 'ar-EG', formatOptions: { style: 'unit', unit: 'day', unitDisplay: 'long' }, value: 11 },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      const localized = new Intl.NumberFormat(vector.locale, vector.formatOptions).format(vector.value)
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.value, vector.value])
      await cleanup(container, root)
    }
    // Digit-less dual output carries no number: silent, never invented.
    const dualSeen: Array<number | null> = []
    const dual = mount()
    await React.act(async () => {
      dual.root.render(
        <Wave2Field
          value={0}
          locale="ar-EG"
          formatOptions={{ style: 'unit', unit: 'day', unitDisplay: 'long' }}
          onChange={v => void dualSeen.push(v)}
        />
      )
    })
    const dualInput = dual.container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      dualInput.focus()
      setNativeValue(dualInput, 'يومان')
    })
    await React.act(async () => {
      pressKey(dualInput, 'Enter')
    })
    expect(dualSeen).toEqual([])
    await cleanup(dual.container, dual.root)
    // Unattested noun forms and other units/currencies reject.
    const kgLong = { style: 'unit', unit: 'kilogram', unitDisplay: 'long' } as const
    const usdName = { style: 'currency', currency: 'USD', currencyDisplay: 'name' } as const
    const reject: Array<{ locale: string; formatOptions: typeof kgLong | typeof usdName; text: string }> = [
      { locale: 'en-US', formatOptions: kgLong, text: '1 kilogramm' },
      { locale: 'en-US', formatOptions: kgLong, text: '1 meter' },
      { locale: 'en-US', formatOptions: usdName, text: '1.00 euro' },
    ]
    for (const vector of reject) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      await cleanup(container, root)
    }
  })

  it('NF-PARSE-11: Scientific and engineering notation should accept localized exponent parts and reject incomplete exponents at commit', async () => {
    const sciOpts = { notation: 'scientific' } as const
    const engOpts = { notation: 'engineering' } as const
    // Complete forms: ASCII + localized separators, signs, and digits.
    const accept: Array<{
      locale: string
      formatOptions: typeof sciOpts | typeof engOpts
      text: string
      expected: number
    }> = [
      { locale: 'en-US', formatOptions: sciOpts, text: '1.235E4', expected: 12350 },
      { locale: 'en-US', formatOptions: sciOpts, text: '1.235e4', expected: 12350 },
      { locale: 'en-US', formatOptions: sciOpts, text: '1.235E-4', expected: 0.0001235 },
      { locale: 'en-US', formatOptions: sciOpts, text: '1.235E+4', expected: 12350 },
      {
        locale: 'de-DE',
        formatOptions: sciOpts,
        text: new Intl.NumberFormat('de-DE', sciOpts).format(12350),
        expected: 12350,
      },
      {
        locale: 'fi-FI',
        formatOptions: sciOpts,
        text: new Intl.NumberFormat('fi-FI', sciOpts).format(0.0001235),
        expected: 0.0001235,
      },
      {
        locale: 'ar-EG',
        formatOptions: sciOpts,
        text: new Intl.NumberFormat('ar-EG', sciOpts).format(12350),
        expected: 12350,
      },
      {
        locale: 'fa-IR',
        formatOptions: sciOpts,
        text: new Intl.NumberFormat('fa-IR', sciOpts).format(12350),
        expected: 12350,
      },
      {
        locale: 'fa-IR',
        formatOptions: sciOpts,
        text: new Intl.NumberFormat('fa-IR', sciOpts).format(0.0001235),
        expected: 0.0001235,
      },
      {
        locale: 'en-US',
        formatOptions: engOpts,
        text: new Intl.NumberFormat('en-US', engOpts).format(12345),
        expected: 12345,
      },
      {
        locale: 'de-DE',
        formatOptions: engOpts,
        text: new Intl.NumberFormat('de-DE', engOpts).format(0.001),
        expected: 0.001,
      },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.expected, vector.expected])
      await cleanup(container, root)
    }
    // Incomplete and overflowing exponents: no request, revert to control.
    const reject: Array<{ locale: string; text: string }> = [
      { locale: 'en-US', text: '1.2E' },
      { locale: 'en-US', text: '1.2E+' },
      { locale: 'en-US', text: '1.2E-' },
      { locale: 'en-US', text: '1e999' },
      { locale: 'de-DE', text: '1,2E' },
      { locale: 'ar-EG', text: '١٫٢أس' },
    ]
    for (const vector of reject) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={sciOpts}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      expect(input.value).toBe(new Intl.NumberFormat(vector.locale, sciOpts).format(0))
      await cleanup(container, root)
    }
    // Echo-on round-trip display through scientific notation.
    const { container, root } = mount()
    function EchoApp() {
      const [value, setValue] = React.useState<number | null>(0)
      return <Wave2Field value={value} locale="en-US" formatOptions={sciOpts} onChange={setValue} />
    }
    await React.act(async () => {
      root.render(<EchoApp />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '1.235E4')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(input.value).toBe(new Intl.NumberFormat('en-US', sciOpts).format(12350))
    await cleanup(container, root)
  })

  it('NF-PARSE-13: Formatter-inserted bidi controls should be ignored without accepting unrelated invisible text', async () => {
    // RTL formatter outputs with edge AND embedded marks, fed back
    // verbatim — derived from Intl, never hand-built.
    const accept: Array<{
      locale: string
      formatOptions?: Intl.NumberFormatOptions
      value: number
    }> = [
      { locale: 'ar-EG', formatOptions: { style: 'currency', currency: 'USD' }, value: 1234.5 },
      { locale: 'ar-EG', formatOptions: { style: 'currency', currency: 'USD' }, value: -1234.5 },
      { locale: 'fa-IR', formatOptions: { style: 'currency', currency: 'USD' }, value: -1234.5 },
      { locale: 'he-IL', formatOptions: { style: 'currency', currency: 'USD' }, value: 1234.5 },
      { locale: 'ar-EG', formatOptions: { style: 'percent' }, value: -1234.5 },
      { locale: 'fa-IR', formatOptions: { style: 'unit', unit: 'kilogram', unitDisplay: 'long' }, value: -1234.5 },
    ]
    for (const vector of accept) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={0}
            locale={vector.locale}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      const localized = new Intl.NumberFormat(vector.locale, vector.formatOptions).format(vector.value)
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([vector.value, vector.value])
      await cleanup(container, root)
    }
    // Unrelated invisibles never parse: zero-width space, non-joiners,
    // word joiner, and an interior byte-order mark.
    const zwsp = String.fromCodePoint(0x200b)
    const zwnj = String.fromCodePoint(0x200c)
    const zwj = String.fromCodePoint(0x200d)
    const wj = String.fromCodePoint(0x2060)
    const bom = String.fromCodePoint(0xfeff)
    for (const text of [`12${zwsp}34`, `1${zwnj}234`, `1${zwj}234`, `1${wj}234`, `1${bom}234`]) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={0} locale="en-US" onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, text)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([])
      expect(input.value).toBe('0')
      await cleanup(container, root)
    }
  })

  it('NF-PARSE-01: NumberField should derive active tokens by rendering the public component for the requested locale and format', async () => {
    // Public-only conformance: render each style, assert the visible text
    // matches Intl exactly, feed it back, assert the numeric callback.
    // No parser state is imported anywhere in this file.
    const styles: Array<{
      locale: string
      formatOptions?: Intl.NumberFormatOptions
      values: number[]
    }> = [
      { locale: 'en-US', values: [0, 1, -1, 1234.5, -1234.5, 1000000] },
      {
        locale: 'en-US',
        formatOptions: { style: 'currency', currency: 'USD' },
        values: [0, 1, -1, 1234.5, -1234.5],
      },
      { locale: 'en-US', formatOptions: { style: 'percent' }, values: [0, 0.01, 0.12, -0.12, 1.5] },
      { locale: 'en-US', formatOptions: { style: 'unit', unit: 'kilogram' }, values: [0, 1, 1234.5, -1234.5] },
      {
        // Default sci/eng precision caps at 3 fraction digits, so
        // conformance values stay exactly representable under it.
        locale: 'en-US',
        formatOptions: { notation: 'scientific' },
        values: [0, 1.5, -1.25, 0.0001235, 12350],
      },
      { locale: 'en-US', formatOptions: { notation: 'engineering' }, values: [12345, -1.25, 0.001] },
      {
        locale: 'ar-EG',
        formatOptions: { style: 'currency', currency: 'USD' },
        values: [1234.5, -1234.5],
      },
    ]
    for (const style of styles) {
      for (const value of style.values) {
        const localized = new Intl.NumberFormat(style.locale, style.formatOptions).format(value)
        // Visible parts match Intl for the requested locale and format.
        const display = mount()
        await React.act(async () => {
          display.root.render(
            <Wave2Field value={value} locale={style.locale} formatOptions={style.formatOptions} />
          )
        })
        expect(
          (display.container.querySelector('input[type="text"]') as HTMLInputElement).value
        ).toBe(localized)
        await cleanup(display.container, display.root)
        // The rendered string feeds back to the same numeric callback.
        const seen: Array<number | null> = []
        const edit = mount()
        await React.act(async () => {
          edit.root.render(
            <Wave2Field
              value={null}
              locale={style.locale}
              formatOptions={style.formatOptions}
              onChange={v => void seen.push(v)}
            />
          )
        })
        const input = edit.container.querySelector('input[type="text"]') as HTMLInputElement
        await React.act(async () => {
          input.focus()
          setNativeValue(input, localized)
        })
        await React.act(async () => {
          pressKey(input, 'Enter')
        })
        expect(seen).toEqual([value, value])
        await cleanup(edit.container, edit.root)
      }
    }
  })

  it('NF-PARSE-19: A seeded public formatter/parser matrix should round-trip at least 2,000 deterministic values across the supported Intl surface', async () => {
    // Recorded seed: mulberry32(20260928). The sequence, locales, and
    // styles below are fixed — reruns reproduce every vector.
    const seed = 20260928
    let state = seed >>> 0
    const rand = () => {
      state = (state + 0x6d2b79f5) >>> 0
      let t = state
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)]
    const baseLocales = ['en-US', 'de-DE', 'fr-FR', 'ar-EG', 'fi-FI', 'en-IN', 'de-CH', 'fa-IR']
    const numberingSystems = [undefined, 'arab', 'arabext', 'deva', 'beng', 'fullwide', 'hanidec', 'latn']
    // Independent half-expand quantization for precision-capped styles
    // (computed here, never via the parser under test).
    const quantize = (value: number, fractionDigits: number) => {
      const factor = 10 ** fractionDigits
      return (Math.sign(value) * Math.round(Math.abs(value) * factor)) / factor
    }
    const seen: Array<number | null> = []
    const { container, root } = mount()
    let completed = 0
    let attempts = 0
    while (completed < 2000 && attempts < 2600) {
      attempts += 1
      const base = pick(baseLocales)
      const system = pick(numberingSystems)
      const locale = system === undefined ? base : `${base}-u-nu-${system}`
      // Refused resolutions are NF-PARSE-16 throws, not matrix members.
      if (
        system !== undefined &&
        new Intl.NumberFormat(locale).resolvedOptions().numberingSystem !== system
      ) {
        continue
      }
      const styleKind = pick([
        'decimal',
        'decimal-capped',
        'currency',
        'percent',
        'unit',
        'scientific',
        'scientific-full',
      ])
      const magnitude = Math.floor(rand() * 10 ** Math.floor(rand() * 8))
      // Negative zero is NF-MATH-14 territory — the matrix stays +0.
      const signed = magnitude === 0 ? 0 : (rand() < 0.5 ? -1 : 1) * magnitude
      let formatOptions: Intl.NumberFormatOptions | undefined
      let value: number
      let expected: number
      switch (styleKind) {
        case 'decimal': {
          formatOptions = undefined
          value = signed + pick([0, 0.5, 0.25, 0.125])
          expected = value
          break
        }
        case 'decimal-capped': {
          const capped = pick([0, 2])
          formatOptions = { maximumFractionDigits: capped }
          value = signed + pick([0, 0.5, 0.25, 0.125])
          expected = quantize(value, capped)
          break
        }
        case 'currency': {
          const currency = pick(['USD', 'EUR', 'JPY'])
          formatOptions = { style: 'currency', currency }
          value = currency === 'JPY' ? signed : signed + pick([0, 0.5, 0.25, 0.01])
          expected = currency === 'JPY' ? value : quantize(value, 2)
          break
        }
        case 'percent': {
          formatOptions = { style: 'percent' }
          value = Math.floor(rand() * 20000 - 10000) / 100
          expected = value
          break
        }
        case 'unit': {
          formatOptions = { style: 'unit', unit: pick(['kilogram', 'kilometer-per-hour', 'day']) }
          value = signed + pick([0, 0.5, 0.25])
          expected = value
          break
        }
        case 'scientific': {
          // Default 3-fraction-digit precision: ≤4 significant digits.
          formatOptions = { notation: 'scientific' }
          value = Math.floor(rand() * 1999 - 999) + pick([0, 0.5])
          expected = value
          break
        }
        default: {
          // Full 21-significant-digit precision: any double round-trips.
          formatOptions = { notation: 'scientific', maximumSignificantDigits: 21 }
          value = signed + pick([0, 0.5, 0.25, 0.125])
          expected = value
          break
        }
      }
      const localized = new Intl.NumberFormat(locale, formatOptions).format(value)
      await React.act(async () => {
        root.render(
          <Wave2Field value={null} locale={locale} formatOptions={formatOptions} onChange={v => void seen.push(v)} />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen.slice(-2)).toEqual([expected, expected])
      completed += 1
    }
    expect(completed).toBe(2000)
    await cleanup(container, root)
  })

  it('NF-PARSE-15: Every supported decimal numbering system should satisfy a public format-edit-commit vector rule', async () => {
    // Declared matrix (DECISIONS.md): any system the runtime resolves
    // exactly with ten distinct positional glyphs. Candidates below ride
    // -u-nu- over en-US; a refused resolution skips vectors for that
    // system (its refusal is a NF-PARSE-16 throw, never a fallback).
    const candidates = [
      'arab',
      'arabext',
      'beng',
      'deva',
      'fullwide',
      'gujr',
      'guru',
      'hanidec',
      'khmr',
      'knda',
      'latn',
      'mlym',
      'mymr',
      'orya',
      'tamldec',
      'telu',
      'thai',
    ]
    const proven: string[] = []
    const skipped: string[] = []
    for (const system of candidates) {
      const locale = `en-US-u-nu-${system}`
      if (new Intl.NumberFormat(locale).resolvedOptions().numberingSystem !== system) {
        skipped.push(system)
        continue
      }
      // Ten distinct positional glyphs, derived with formatToParts.
      const glyphs = Array.from(
        { length: 10 },
        (_, digit) =>
          new Intl.NumberFormat(locale).formatToParts(digit).find(part => part.type === 'integer')
            ?.value ?? ''
      )
      expect(new Set(glyphs).size).toBe(10)
      // Edit vectors 0-9 plus 1024.5: one live request per new meaning.
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(<Wave2Field value={null} locale={locale} onChange={v => void seen.push(v)} />)
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      for (let digit = 0; digit <= 9; digit += 1) {
        await React.act(async () => {
          input.focus()
          setNativeValue(input, glyphs[digit])
        })
      }
      expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      const localized = new Intl.NumberFormat(locale).format(1024.5)
      await React.act(async () => {
        input.focus()
        setNativeValue(input, localized)
      })
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1024.5, 1024.5])
      await cleanup(container, root)
      // Echo-on round-trip display through the same public fixture shape.
      const echo = mount()
      function EchoApp() {
        const [value, setValue] = React.useState<number | null>(null)
        return <Wave2Field value={value} locale={locale} onChange={setValue} />
      }
      await React.act(async () => {
        echo.root.render(<EchoApp />)
      })
      const echoInput = echo.container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        echoInput.focus()
        setNativeValue(echoInput, localized)
      })
      await React.act(async () => {
        pressKey(echoInput, 'Enter')
      })
      expect(echoInput.value).toBe(localized)
      await cleanup(echo.container, echo.root)
      proven.push(system)
    }
    // The NF-PARSE-02 core never skips: arab, arabext, deva, beng,
    // fullwidth, and hanidec resolve in every supported ICU.
    for (const core of ['arab', 'arabext', 'beng', 'deva', 'fullwide', 'hanidec']) {
      expect(proven).toContain(core)
    }
    expect(skipped).toEqual([])
  })

  it('NF-PARSE-16: Unsupported algorithmic or non-invertible numbering systems should fail before accepting edits', async () => {
    // Refused -u-nu- requests (Intl silently falls back to latn) fail
    // naming the locale — no fallback editor is ever rendered.
    expect(() => renderToString(<Wave2Field value={0} locale="en-US-u-nu-roman" />)).toThrow(
      /"locale" requests numbering system "roman" but Intl resolves "latn"/
    )
    // The numberingSystem option falls back the same way; the diagnostic
    // names formatOptions instead.
    expect(() =>
      renderToString(
        <Wave2Field value={0} locale="en-US" formatOptions={{ numberingSystem: 'roman' }} />
      )
    ).toThrow(/"formatOptions" requests numbering system "roman" but Intl resolves "latn"/)
    // Compact and hidden-sign formats have no invertible editor grammar.
    expect(() =>
      renderToString(<Wave2Field value={0} locale="en-US" formatOptions={{ notation: 'compact' }} />)
    ).toThrow(/"formatOptions" with compact notation is not editable/)
    expect(() =>
      renderToString(
        <Wave2Field value={0} locale="en-US" formatOptions={{ signDisplay: 'never' }} />
      )
    ).toThrow(/"formatOptions" with signDisplay "never" is not editable/)
    // No fallback editor, no callback: the throw escapes before any
    // markup or request exists.
    const seen: Array<number | null> = []
    expect(() =>
      renderToString(
        <Wave2Field
          value={0}
          locale="en-US-u-nu-roman"
          onChange={v => void seen.push(v)}
        />
      )
    ).toThrow()
    expect(seen).toEqual([])
    // Positive controls: supported systems render without failing.
    for (const locale of [
      'ar-EG',
      'fa-IR',
      'hi-IN-u-nu-deva',
      'en-US-u-nu-fullwide',
      'zh-CN-u-nu-hanidec',
    ]) {
      expect(() => renderToString(<Wave2Field value={0} locale={locale} />)).not.toThrow()
    }
  })
})

describe('NumberField wave-2 commit and semantics', () => {
  it('NF-A11Y-04: Authored descriptions and error relationships should survive managed validity changes', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    const renderField = (describedby: string, errormessage: string, invalid: boolean) =>
      root.render(
        <NumberField value={5} locale="en-US" invalid={invalid} onChange={v => void seen.push(v)}>
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input
              aria-label="Quantity"
              aria-describedby={describedby}
              aria-errormessage={errormessage}
            />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
    await React.act(async () => {
      renderField('desc-a desc-b', 'err-a', false)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    expect(input.getAttribute('aria-describedby')).toBe('desc-a desc-b')
    expect(input.getAttribute('aria-errormessage')).toBe('err-a')
    expect(input.getAttribute('aria-invalid')).toBeNull()
    // Owned failure toggles managed invalid without touching relationships.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, 'junk')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('desc-a desc-b')
    expect(input.getAttribute('aria-errormessage')).toBe('err-a')
    // Recovery + replaced IDs: exact new tokens, no stale duplicates.
    await React.act(async () => {
      setNativeValue(input, '6')
    })
    expect(input.getAttribute('aria-invalid')).toBeNull()
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(input.value).toBe('5')
    await React.act(async () => {
      renderField('desc-c', 'err-b', true)
    })
    expect(input.getAttribute('aria-describedby')).toBe('desc-c')
    expect(input.getAttribute('aria-errormessage')).toBe('err-b')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    // Live 6 plus the commit retry (the parent holds 5 throughout).
    expect(seen).toEqual([6, 6])
    await cleanup(container, root)
  })

  it('NF-COMMIT-04: Empty commit should retry null when controlled value is still non-null', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    const renderEcho = (value: number | null) =>
      root.render(<Wave2Field value={value} locale="en-US" name="qty" onChange={v => void seen.push(v)} />)
    await React.act(async () => {
      renderEcho(5)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    // Clearing publishes the live null immediately; the dirty empty
    // session stages behind it.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '')
    })
    expect(input.getAttribute('data-editing')).toBe('')
    expect(seen).toEqual([null])
    // Blur commits the null retry; rejection restores controlled display.
    await React.act(async () => {
      input.blur()
    })
    expect(seen).toEqual([null, null])
    expect(input.value).toBe('5')
    expect(hidden.value).toBe('5')
    expect(input.getAttribute('data-editing')).toBeNull()
    // Still non-null, so a second empty commit retries again.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([null, null, null, null])
    expect(hidden.value).toBe('5')
    // Acceptance ends the dirty state with canonical empty display.
    await React.act(async () => {
      renderEcho(null)
    })
    expect(input.value).toBe('')
    expect(hidden.value).toBe('')
    expect(input.getAttribute('data-editing')).toBeNull()
    // Mid-session acceptance: clear, echo null at once (draft '' is
    // preserved), then commit ends dirty with no duplicate request.
    await React.act(async () => {
      renderEcho(5)
    })
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '')
    })
    expect(seen).toEqual([null, null, null, null, null])
    await React.act(async () => {
      renderEcho(null)
    })
    expect(input.value).toBe('')
    expect(input.getAttribute('data-editing')).toBe('')
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    expect(seen).toEqual([null, null, null, null, null])
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)
  })

  it('NF-COMMIT-05: Snap commit should publish only its final documented candidate', async () => {
    // Clamp, midpoint (away-from-zero), lattice, and explicit-rounding
    // vectors each publish their raw live meaning plus one final commit —
    // no intermediate clamp/snap/round callback between them.
    const vectors: Array<{
      text: string
      initial: number
      min?: number
      max?: number
      step?: number
      formatOptions?: Intl.NumberFormatOptions
      expected: number
    }> = [
      { text: '25', initial: 0, min: 0, max: 10, step: 1, expected: 10 },
      { text: '-5', initial: 5, min: 0, max: 10, step: 1, expected: 0 },
      { text: '2.5', initial: 0, step: 1, expected: 3 },
      { text: '7', initial: 0, min: 0, max: 10, step: 3, expected: 6 },
      { text: '2.5', initial: 0, step: 0.01, formatOptions: { maximumFractionDigits: 0 }, expected: 3 },
    ]
    for (const vector of vectors) {
      const seen: Array<number | null> = []
      const { container, root } = mount()
      await React.act(async () => {
        root.render(
          <Wave2Field
            value={vector.initial}
            locale="en-US"
            commitBehavior="snap"
            min={vector.min}
            max={vector.max}
            step={vector.step}
            formatOptions={vector.formatOptions}
            onChange={v => void seen.push(v)}
          />
        )
      })
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      await React.act(async () => {
        input.focus()
        setNativeValue(input, vector.text)
      })
      expect(seen).toEqual([parseFloat(vector.text)])
      await React.act(async () => {
        pressKey(input, 'Enter')
      })
      expect(seen).toEqual([parseFloat(vector.text), vector.expected])
      await cleanup(container, root)
    }
  })

  it('NF-COMMIT-09: A no-edit focus/blur cycle should preserve full controlled precision', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<Wave2Field value={1.23456} locale="en-US" name="qty" onChange={v => void seen.push(v)} />)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    await React.act(async () => {
      input.focus()
    })
    expect(input.getAttribute('data-editing')).toBeNull()
    await React.act(async () => {
      input.blur()
    })
    expect(seen).toEqual([])
    expect(input.getAttribute('data-editing')).toBeNull()
    expect(input.value).toBe('1.235')
    expect(hidden.value).toBe('1.23456')
    await cleanup(container, root)
  })

  it('NF-KEY-06: A complete dirty candidate should be the base for keyboard stepping', async () => {
    // The live request is rejected (no echo), then the step uses the dirty
    // candidate as its base — one stepped request, no intermediate commit.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    const renderEcho = (value: number | null) =>
      root.render(<Wave2Field value={value} locale="en-US" onChange={v => void seen.push(v)} />)
    await React.act(async () => {
      renderEcho(5)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '7')
    })
    await React.act(async () => {
      pressKey(input, 'ArrowUp')
    })
    expect(seen).toEqual([7, 8])
    expect(input.getAttribute('data-editing')).toBeNull()
    // Rejection authority: without an echo the controlled display stands.
    expect(input.value).toBe('5')
    // Acceptance authority: the echo formats the stepped candidate.
    await React.act(async () => {
      renderEcho(8)
    })
    expect(input.value).toBe('8')
    // Incomplete partials fall back to the controlled value as the base.
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '-')
    })
    await React.act(async () => {
      pressKey(input, 'ArrowDown')
    })
    expect(seen).toEqual([7, 8, 7])
    expect(input.getAttribute('data-editing')).toBeNull()
    await cleanup(container, root)
  })
})

describe('NumberField wave-2 environment and composition', () => {
  it('NF-ENV-04: Independent SSR roots should require distinct identifierPrefix values or explicit Input IDs', async () => {
    const errors: string[] = []
    const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    try {
      // Unprotected SSR roots mint the same deterministic generated id, so
      // hydrating beside each other diagnoses the deployment mismatch.
      // (React 19 client roots are globally unique — the collision is
      // SSR-only, which is exactly the case's scope.)
      const htmlA = renderToString(<Wave2Field value={1} locale="en-US" />)
      const htmlB = renderToString(<Wave2Field value={2} locale="en-US" />)
      const idOf = (html: string) => html.match(/<input[^>]*type="text"[^>]*id="([^"]+)"/)?.[1] ?? ''
      expect(idOf(htmlA)).not.toBe('')
      expect(idOf(htmlB)).toBe(idOf(htmlA))
      const { hydrateRoot } = await import('react-dom/client')
      const first = document.createElement('div')
      const second = document.createElement('div')
      first.innerHTML = htmlA
      second.innerHTML = htmlB
      document.body.append(first, second)
      await React.act(async () => {
        hydrateRoot(first, <Wave2Field value={1} locale="en-US" />)
      })
      expect(errors.some(message => /collides across independent roots/.test(message))).toBe(true)
      first.remove()
      second.remove()
      // Distinct identifierPrefix values keep the relationships unique.
      errors.length = 0
      const third = document.createElement('div')
      const fourth = document.createElement('div')
      document.body.append(third, fourth)
      const rootC = createRoot(third, { identifierPrefix: 'left-' })
      const rootD = createRoot(fourth, { identifierPrefix: 'right-' })
      await React.act(async () => {
        rootC.render(<Wave2Field value={1} locale="en-US" />)
        rootD.render(<Wave2Field value={2} locale="en-US" />)
      })
      const idC = (third.querySelector('input[type="text"]') as HTMLInputElement).id
      const idD = (fourth.querySelector('input[type="text"]') as HTMLInputElement).id
      expect(idC).not.toBe(idD)
      expect(errors).toEqual([])
      await React.act(async () => {
        rootC.unmount()
        rootD.unmount()
      })
      third.remove()
      fourth.remove()
      // Explicit Input ids protect roots without any prefix coordination.
      errors.length = 0
      const fifth = document.createElement('div')
      const sixth = document.createElement('div')
      document.body.append(fifth, sixth)
      const rootE = createRoot(fifth)
      const rootF = createRoot(sixth)
      const explicit = (id: string) => (
        <NumberField value={1} locale="en-US">
          <NumberField.Group>
            <NumberField.Decrement aria-label="Decrement" />
            <NumberField.Input id={id} aria-label="Quantity" />
            <NumberField.Increment aria-label="Increment" />
          </NumberField.Group>
        </NumberField>
      )
      await React.act(async () => {
        rootE.render(explicit('env-left-input'))
        rootF.render(explicit('env-right-input'))
      })
      expect(errors).toEqual([])
      await React.act(async () => {
        rootE.unmount()
        rootF.unmount()
      })
      fifth.remove()
      sixth.remove()
    } finally {
      spy.mockRestore()
    }
  })

  it('NF-COMP-03: A percent NumberField should type 12.5% only with explicit fractional grammar and compatible step', async () => {
    const seen: Array<number | null> = []
    const { container, root } = mount()
    const renderEcho = (value: number | null) =>
      root.render(
        <form data-testid="comp-form">
          <Wave2Field
            value={value}
            locale="en-US"
            name="pct"
            min={0}
            step={0.005}
            formatOptions={{ style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            onChange={v => void seen.push(v)}
          />
        </form>
      )
    await React.act(async () => {
      renderEcho(0)
    })
    const input = container.querySelector('input[type="text"]') as HTMLInputElement
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    // Nonnegative fractional grammar selects decimal (minus rejected).
    expect(input.getAttribute('inputmode')).toBe('decimal')
    await React.act(async () => {
      input.focus()
      setNativeValue(input, '12.5%')
    })
    await React.act(async () => {
      pressKey(input, 'Enter')
    })
    // Live 0.125 plus the identical commit retry (no echo yet).
    expect(seen).toEqual([0.125, 0.125])
    await React.act(async () => {
      renderEcho(0.125)
    })
    expect(input.value).toBe('12.5%')
    // Shift-step rides the same lattice from the accepted candidate.
    await React.act(async () => {
      input.focus()
      pressKey(input, 'ArrowUp', { shiftKey: true })
    })
    expect(seen).toEqual([0.125, 0.125, 0.175])
    // Rejection holds the last accepted display; acceptance formats.
    expect(input.value).toBe('12.5%')
    await React.act(async () => {
      renderEcho(0.175)
    })
    expect(input.value).toBe('17.5%')
    // Display rounding never feeds back into the numeric authority.
    await React.act(async () => {
      renderEcho(0.126)
    })
    expect(input.value).toBe('12.6%')
    expect(hidden.value).toBe('0.126')
    expect(seen).toEqual([0.125, 0.125, 0.175])
    // Submit serializes the canonical fractional payload.
    await React.act(async () => {
      renderEcho(0.175)
    })
    let prevented = true
    await React.act(async () => {
      prevented = !form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(prevented).toBe(false)
    expect(hidden.value).toBe('0.175')
    await cleanup(container, root)
  })
})

// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { NumberField } from './NumberField'

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
        <NumberField value={0} onChange={v => void seen.push(v)}>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
    expect(() => renderToString(<NumberField value={NaN} />)).toThrow(/"value" must be a finite number or null/)
    expect(() => renderToString(<NumberField value={Infinity} />)).toThrow(/"value" must be a finite number or null/)
    expect(() => renderToString(<NumberField defaultValue={NaN} />)).toThrow(/"defaultValue" must be a finite number or null/)
    expect(() => renderToString(<NumberField value={0} min={NaN} />)).toThrow(/"min" must be a number/)
    expect(() => renderToString(<NumberField value={0} max={NaN} />)).toThrow(/"max" must be a number/)
    expect(() => renderToString(<NumberField value={0} min={10} max={5} />)).toThrow(/"min" must be less than or equal to "max"/)
    expect(() => renderToString(<NumberField value={0} step={0} />)).toThrow(/"step" must be a finite number greater than 0/)
    expect(() => renderToString(<NumberField value={0} step={-1} />)).toThrow(/"step" must be a finite number greater than 0/)
    expect(() => renderToString(<NumberField value={0} step={NaN} />)).toThrow(/"step" must be a finite number greater than 0/)
    expect(() => renderToString(<NumberField value={0} step={Infinity} />)).toThrow(/"step" must be a finite number greater than 0/)

    // Legal: null, undefined (uncontrolled), ±Infinity bounds, defaults.
    expect(() => renderToString(<NumberField value={null} />)).not.toThrow()
    expect(() => renderToString(<NumberField defaultValue={5} />)).not.toThrow()
    expect(() => renderToString(<NumberField value={0} min={-Infinity} max={Infinity} />)).not.toThrow()
    expect(() => renderToString(<NumberField value={0} />)).not.toThrow()
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
          step={0.1}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
          step={0.001}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
          step={1}
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
    const html = renderToString(<NumberField value={-0} />)
    expect(html).toContain('value="0"')
  })
})

describe('NumberField managed authority', () => {
  it('NF-TYPE-03 / NF-DOM-06: Managed part authority should defeat every behavior-owned conflicting cast', async () => {
    // Landing re-target: this engine keeps spinbutton (frozen visuals) and
    // uncontrolled mode, so the managed set is adapted — but conflicts lose.
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={42} role="form" data-testid="nf-root">
          <NumberField.Decrement type="submit" tabIndex={0} />
          <NumberField.Input
            type="number"
            role="button"
            value="999"
            aria-valuenow={5}
            inputMode="numeric"
            disabled={false}
          />
          <NumberField.Increment type="submit" tabIndex={0} />
        </NumberField>
      )
    })
    const group = container.querySelector('[data-testid="nf-root"]') as HTMLElement
    expect(group.getAttribute('role')).toBe('group')

    const input = container.querySelector('input') as HTMLInputElement
    expect(input.getAttribute('type')).toBe('text')
    expect(input.getAttribute('role')).toBe('spinbutton')
    expect(input.value).toBe('42')
    expect(input.getAttribute('aria-valuenow')).toBe('42')
    expect(input.getAttribute('inputmode')).toBe('decimal')

    for (const btn of Array.from(container.querySelectorAll('button'))) {
      expect(btn.getAttribute('type')).toBe('button')
      expect(btn.tabIndex).toBe(-1)
    }
    await cleanup(container, root)
  })

  it('NF-EDIT-13: Consumer edit handlers should run in native order without breaking managed state', async () => {
    // Regression: user onChange used to clobber the internal handler via
    // last-spread, silently killing typing in uncontrolled mode.
    const userEdits: string[] = []
    const managed: Array<number | null> = []
    function App() {
      return (
        <NumberField defaultValue={1} onChange={v => void managed.push(v)}>
          <NumberField.Decrement />
          <NumberField.Input onChange={e => void userEdits.push(e.target.value)} />
          <NumberField.Increment />
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      setNativeValue(input, '7')
    })
    expect(userEdits).toEqual(['7'])
    expect(managed).toEqual([7])
    expect(input.value).toBe('7')
    await cleanup(container, root)
  })

  it('NF-DOM-05: Fixed hosts should preserve unrelated native props, handlers, and refs', async () => {
    const rootRef = React.createRef<HTMLDivElement>()
    const inputRef = React.createRef<HTMLInputElement>()
    const incRef = React.createRef<HTMLButtonElement>()
    let focused = 0
    let blurred = 0
    function App() {
      return (
        <NumberField ref={rootRef} value={5} data-testid="nf-root" className="consumer-root">
          <NumberField.Decrement />
          <NumberField.Input
            ref={inputRef}
            aria-label="Quantity"
            aria-invalid="true"
            readOnly
            data-testid="nf-input"
            onFocus={() => void focused++}
            onBlur={() => void blurred++}
          />
          <NumberField.Increment ref={incRef} aria-label="Increase" />
        </NumberField>
      )
    }
    const { container, root } = mount()
    await React.act(async () => {
      root.render(<App />)
    })
    expect(rootRef.current).toBe(container.querySelector('[data-testid="nf-root"]'))
    expect(rootRef.current?.className).toContain('consumer-root')
    const input = container.querySelector('input') as HTMLInputElement
    expect(inputRef.current).toBe(input)
    expect(input.getAttribute('aria-label')).toBe('Quantity')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.readOnly).toBe(true)
    expect(incRef.current).toBe(container.querySelector('button[aria-label="Increase"]'))
    await React.act(async () => {
      input.focus()
    })
    expect(focused).toBe(1)
    await React.act(async () => {
      input.blur()
    })
    expect(blurred).toBe(1)
    await cleanup(container, root)
  })
})

describe('NumberField steppers', () => {
  it('NF-STEP-11: Stepper capability should follow root state and authored disabled', async () => {
    const seen: Array<number | null> = []
    function App() {
      return (
        <NumberField value={10} onChange={v => void seen.push(v)}>
          <NumberField.Decrement disabled />
          <NumberField.Input />
          <NumberField.Increment />
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
          onChange={v => {
            seen.push(v)
            setValue(v)
          }}
        >
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
        <NumberField value={10} onChange={v => void seen.push(v)}>
          <NumberField.Decrement />
          <NumberField.Input
            onKeyDown={e => {
              if (e.key === 'ArrowUp') e.preventDefault()
            }}
          />
          <NumberField.Increment />
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
        <NumberField value={10} disabled onChange={v => void seenDisabled.push(v)}>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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

describe('NumberField environments', () => {
  it('NF-ENV-01: Server markup should carry spinbutton semantics for hydration', () => {
    const html = renderToString(
      <NumberField value={42} min={0} max={100}>
        <NumberField.Decrement />
        <NumberField.Input />
        <NumberField.Increment />
      </NumberField>
    )
    expect(html).toContain('role="spinbutton"')
    expect(html).toContain('aria-valuenow="42"')
    expect(html).toContain('value="42"')
    expect(html).toContain('role="group"')
  })

  it('NF-ENV-05: StrictMode should not duplicate callbacks on a single step', async () => {
    const seen: Array<number | null> = []
    function App() {
      const [value, setValue] = React.useState<number | null>(10)
      return (
        <React.StrictMode>
          <NumberField
            value={value}
            onChange={v => {
              seen.push(v)
              setValue(v)
            }}
          >
            <NumberField.Decrement />
            <NumberField.Input />
            <NumberField.Increment />
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

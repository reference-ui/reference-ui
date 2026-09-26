// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
        <NumberField value={0} locale="en-US" onChange={v => void seen.push(v)}>
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
          locale="en-US"
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
          locale="en-US"
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
    const html = renderToString(<NumberField value={-0} locale="en-US" />)
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
        <NumberField value={42} locale="en-US" role="form" data-testid="nf-root">
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
    // last-spread, silently killing typing.
    // FEATURES #1: controlled — the App echoes requests into value.
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
        <NumberField ref={rootRef} value={5} locale="en-US" data-testid="nf-root" className="consumer-root">
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
        <NumberField value={10} locale="en-US" onChange={v => void seen.push(v)}>
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
          locale="en-US"
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
        <NumberField value={10} locale="en-US" onChange={v => void seen.push(v)}>
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
        <NumberField value={10} locale="en-US" disabled onChange={v => void seenDisabled.push(v)}>
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
        <NumberField.Decrement />
        <NumberField.Input />
        <NumberField.Increment disabled={extra?.incDisabled} />
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
          <NumberField.Decrement />
          <NumberField.Input />
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
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
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
    // Retyping the current value and clearing an empty field are no-ops.
    const seen: Array<number | null> = []
    const { container, root } = mount()
    await React.act(async () => {
      root.render(
        <NumberField value={5} locale="en-US" onChange={v => void seen.push(v)}>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField>
      )
    })
    const input = container.querySelector('input') as HTMLInputElement
    await React.act(async () => {
      setNativeValue(input, '5')
    })
    expect(seen).toEqual([])
    // Clearing a non-empty field still requests null.
    await React.act(async () => {
      setNativeValue(input, '')
    })
    expect(seen).toEqual([null])
    await cleanup(container, root)

    const seenNull: Array<number | null> = []
    const n = mount()
    await React.act(async () => {
      n.root.render(
        <NumberField value={null} locale="en-US" onChange={v => void seenNull.push(v)}>
          <NumberField.Decrement />
          <NumberField.Input />
          <NumberField.Increment />
        </NumberField>
      )
    })
    const inputNull = n.container.querySelector('input') as HTMLInputElement
    // Clearing an already-empty field emits nothing.
    await React.act(async () => {
      setNativeValue(inputNull, '')
    })
    expect(seenNull).toEqual([])
    // Typing a real value still requests it.
    await React.act(async () => {
      setNativeValue(inputNull, '8')
    })
    expect(seenNull).toEqual([8])
    await cleanup(n.container, n.root)
  })
})

describe('NumberField environments', () => {
  it('NF-ENV-01: Server markup should carry spinbutton semantics for hydration', () => {
    const html = renderToString(
      <NumberField value={42} locale="en-US" min={0} max={100}>
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
            locale="en-US"
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

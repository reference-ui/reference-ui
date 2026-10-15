// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Listbox,
  validateVirtualAdapter,
  computeNextMultipleSelection,
  type VirtualFocusAdapter,
  type ListboxProps,
  type ListboxSingleProps,
  type ListboxMultipleProps,
  type ListboxOptionProps,
} from './index'
import { ComboboxContext } from '../Combobox/combobox-context'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('Listbox Unit Contract', () => {
  class CaptureBoundary extends React.Component<{
    onError: (error: Error) => void
    children: React.ReactNode
  }> {
    state: { caught: Error | null } = { caught: null }
    static getDerivedStateFromError(error: Error) {
      return { caught: error }
    }
    componentDidCatch(error: Error) {
      this.props.onError(error)
    }
    render() {
      return this.state.caught ? null : this.props.children
    }
  }

  function boundary(element: React.ReactElement, errors: Error[]) {
    return React.createElement(CaptureBoundary, {
      onError: (e: Error) => errors.push(e),
      children: element,
    })
  }

  describe('Public API and TypeScript types', () => {
    it('compiles with controlled types and no defaultValue', () => {
      const validProps: ListboxProps = {
        value: 'alpha',
        onChange: (_val) => {},
        selection: 'single',
        orientation: 'vertical',
      }
      expect(validProps.selection).toBe('single')

      const validOptionProps: ListboxOptionProps = {
        value: 'alpha',
        disabled: false,
        textValue: 'Alpha option',
        index: 0,
      }
      expect(validOptionProps.value).toBe('alpha')

      // @ts-expect-error - defaultValue must not exist on ListboxProps
      const _invalidDefault: ListboxProps = { defaultValue: 'alpha' }
      expect(_invalidDefault).toBeTruthy()
    })

    it('types single vs multiple selection as discriminated overloads sharing one generic', () => {
      // Single: TValue | null end to end, literal-narrowed
      const single: ListboxProps<'apple' | 'banana'> = {
        selection: 'single',
        value: 'apple',
        onChange: val => {
          const _check: 'apple' | 'banana' | null = val
          expect(_check).toBeDefined()
        },
      }
      expect(single.selection).toBe('single')

      // Omitted selection means single
      const omitted: ListboxProps = { value: null, onChange: () => {} }
      expect(omitted.value).toBeNull()

      // Multiple: TValue[] end to end
      const multi: ListboxProps<'a' | 'b'> = {
        selection: 'multiple',
        value: ['a'],
        onChange: vals => {
          const _check: Array<'a' | 'b'> = vals
          expect(_check).toBeDefined()
        },
      }
      expect(multi.selection).toBe('multiple')

      // useState setters plug directly into the matching overload
      const setSingle: React.Dispatch<React.SetStateAction<string | null>> = () => {}
      const _plugSingle: ListboxSingleProps = { onChange: setSingle }
      expect(_plugSingle).toBeTruthy()
      const setMulti: React.Dispatch<React.SetStateAction<string[]>> = () => {}
      const _plugMulti: ListboxMultipleProps = { selection: 'multiple', onChange: setMulti }
      expect(_plugMulti).toBeTruthy()

      // @ts-expect-error - single rejects arrays
      const _badSingle: ListboxProps = { selection: 'single', value: ['a'] }
      expect(_badSingle).toBeTruthy()

      // @ts-expect-error - multiple rejects scalars
      const _badMulti: ListboxProps = { selection: 'multiple', value: 'a' }
      expect(_badMulti).toBeTruthy()

      // @ts-expect-error - arrays require the multiple discriminant
      const _badMissing: ListboxProps = { value: ['a'] }
      expect(_badMissing).toBeTruthy()
    })

    it('shares the generic with options and the virtual adapter', () => {
      const opt: ListboxOptionProps<'k1' | 'k2'> = { value: 'k1', index: 0 }
      expect(opt.value).toBe('k1')

      const adapter: VirtualFocusAdapter<'k1' | 'k2'> = {
        items: [{ value: 'k1', textValue: 'K1' }],
        scrollToIndex: () => {},
      }
      expect(() => validateVirtualAdapter(adapter, [{ value: 'k1', index: 0 }])).not.toThrow()

      // @ts-expect-error - adapter values outside the generic are rejected
      const _badAdapter: VirtualFocusAdapter<'k1' | 'k2'> = { items: [{ value: 'nope', textValue: 'Nope' }], scrollToIndex: () => {} }
      expect(_badAdapter).toBeTruthy()
    })

    it('keeps unknown multi values inside the shared generic', () => {
      const next = computeNextMultipleSelection<'x' | 'y' | 'zzz'>(['zzz', 'x'], 'y', ['x', 'y'])
      const _check: Array<'x' | 'y' | 'zzz'> = next
      expect(next).toEqual(['x', 'y', 'zzz'])
    })
  })

  describe('Virtualization logical and mounted registration validation', () => {
    it('LB-VIRT-01: Virtual Listbox should reject inconsistent logical and mounted registrations', () => {
      // 1. Build ten valid logical items
      const validItems = Array.from({ length: 10 }, (_, i) => ({
        value: `item-${i}`,
        textValue: `Item ${i}`,
        disabled: i === 3,
      }))

      const adapter: VirtualFocusAdapter = {
        items: validItems,
        scrollToIndex: vi.fn(),
      }

      // Valid mapping (indices 2 to 5 matching logical items)
      const validMounted = [
        { value: 'item-2', index: 2, disabled: false },
        { value: 'item-3', index: 3, disabled: true },
        { value: 'item-4', index: 4, disabled: false },
        { value: 'item-5', index: 5, disabled: false },
      ]
      expect(() => validateVirtualAdapter(adapter, validMounted)).not.toThrow()

      // 2. Reject duplicate values in logical items
      const duplicateLogicalAdapter: VirtualFocusAdapter = {
        items: [
          { value: 'item-0', textValue: 'Item 0' },
          { value: 'item-1', textValue: 'Item 1' },
          { value: 'item-0', textValue: 'Item 0 Dup' },
        ],
        scrollToIndex: vi.fn(),
      }
      expect(() => validateVirtualAdapter(duplicateLogicalAdapter, [])).toThrowError(
        /Duplicate value in virtual items: "item-0"/
      )

      // 3. Reject negative mounted index
      expect(() =>
        validateVirtualAdapter(adapter, [{ value: 'item-0', index: -1 }])
      ).toThrowError(/out of range/)

      // 4. Reject out-of-range mounted index (>= items.length)
      expect(() =>
        validateVirtualAdapter(adapter, [{ value: 'item-10', index: 10 }])
      ).toThrowError(/Option index 10 out of range/)

      // 5. Reject duplicate mounted indices
      expect(() =>
        validateVirtualAdapter(adapter, [
          { value: 'item-2', index: 2 },
          { value: 'item-2', index: 2 },
        ])
      ).toThrowError(/Duplicate mounted option index: 2/)

      // 6. Reject mounted value mismatch with logical item
      expect(() =>
        validateVirtualAdapter(adapter, [{ value: 'item-wrong', index: 2 }])
      ).toThrowError(
        /Mounted option value "item-wrong" does not match virtual item value "item-2" at index 2/
      )

      // 7. Reject mounted disabled state mismatch with logical item
      expect(() =>
        validateVirtualAdapter(adapter, [{ value: 'item-3', index: 3, disabled: false }])
      ).toThrowError(
        /Mounted option disabled state does not match virtual item disabled state at index 3/
      )
    })
  })

  describe('Virtual adapter registration wiring', () => {
    it('LB-VIRT-09 (unit): Virtual Listbox should emit a descriptive diagnostic for an invalid indexed mount', async () => {
      const adapter: VirtualFocusAdapter = {
        items: [
          { value: 'item-0', textValue: 'Item 0' },
          { value: 'item-1', textValue: 'Item 1' },
        ],
        scrollToIndex: vi.fn(),
      }
      const errors: Error[] = []
      const container = document.createElement('div')
      document.body.appendChild(container)
      const root = createRoot(container)
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        await React.act(async () => {
          root.render(
            boundary(
              React.createElement(
                Listbox,
                { value: null, onChange: () => {}, virtual: adapter },
                React.createElement(Listbox.Option, { value: 'item-WRONG', index: 0 }, 'Wrong')
              ),
              errors
            )
          )
        })
      } finally {
        errSpy.mockRestore()
      }

      expect(errors).toHaveLength(1)
      expect(errors[0].message).toMatch(
        /Mounted option value "item-WRONG" does not match virtual item value "item-0" at index 0/
      )

      await React.act(async () => {
        root.unmount()
      })
      container.remove()
    })

    it('LB-VIRT-09 (unit): Virtual Listbox should emit a descriptive diagnostic when logical items are replaced with an invalid mapping', async () => {
      const validAdapter: VirtualFocusAdapter = {
        items: [
          { value: 'item-0', textValue: 'Item 0' },
          { value: 'item-1', textValue: 'Item 1' },
        ],
        scrollToIndex: vi.fn(),
      }
      const errors: Error[] = []
      const container = document.createElement('div')
      document.body.appendChild(container)
      const root = createRoot(container)
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        await React.act(async () => {
          root.render(
            boundary(
              React.createElement(
                Listbox,
                { value: null, onChange: () => {}, virtual: validAdapter },
                React.createElement(Listbox.Option, { value: 'item-0', index: 0 }, 'Item 0')
              ),
              errors
            )
          )
        })

        // Valid adapters register silently
        expect(errors).toHaveLength(0)
        const mounted = container.querySelector('[data-value="item-0"]')
        expect(mounted).toBeTruthy()
        expect(mounted?.getAttribute('aria-setsize')).toBe('2')

        const duplicateAdapter: VirtualFocusAdapter = {
          items: [
            { value: 'item-0', textValue: 'Item 0' },
            { value: 'item-0', textValue: 'Item 0 dup' },
          ],
          scrollToIndex: vi.fn(),
        }
        await React.act(async () => {
          root.render(
            boundary(
              React.createElement(
                Listbox,
                { value: null, onChange: () => {}, virtual: duplicateAdapter },
                React.createElement(Listbox.Option, { value: 'item-0', index: 0 }, 'Item 0')
              ),
              errors
            )
          )
        })
      } finally {
        errSpy.mockRestore()
      }

      // Both wiring points (indexed re-registration, items-change effect) fire
      // the same descriptive diagnostic for the invalid replacement.
      expect(errors.length).toBeGreaterThanOrEqual(1)
      for (const error of errors) {
        expect(error.message).toMatch(/Duplicate value in virtual items: "item-0"/)
      }

      await React.act(async () => {
        root.unmount()
      })
      container.remove()
    })
  })

  describe('Multiple selection algorithm', () => {
    it('LB-MULTI-03 (unit): Multiple selection retains known items in collection order and appends unknown values', () => {
      const collectionOrder = ['alpha', 'bravo', 'charlie']
      const incoming = ['unknown-2', 'charlie', 'alpha', 'charlie', 'unknown-1']

      // Activate unselected bravo:
      const next = computeNextMultipleSelection(incoming, 'bravo', collectionOrder)
      expect(next).toEqual(['alpha', 'bravo', 'charlie', 'unknown-2', 'unknown-1'])
    })
  })

  describe('Environment SSR and StrictMode', () => {
    it('LB-ENV-01: Listbox should hydrate stable roles, selection, and IDs without requesting state', async () => {
      const onChange = vi.fn()
      const element = React.createElement(
        Listbox,
        { value: 'bravo', onChange },
        React.createElement(Listbox.Option, { value: 'alpha' }, 'Alpha'),
        React.createElement(Listbox.Option, { value: 'bravo' }, 'Bravo'),
        React.createElement(Listbox.Option, { value: 'charlie', disabled: true }, 'Charlie')
      )

      // 1. Server render
      const html = renderToString(element)
      expect(html).toContain('role="listbox"')
      expect(html).toContain('role="option"')
      expect(html).toContain('id="ref-opt-alpha"')
      expect(html).toContain('id="ref-opt-bravo"')
      expect(html).toContain('id="ref-opt-charlie"')
      expect(html).toContain('aria-selected="true"')
      expect(html).toContain('aria-disabled="true"')

      // 2. Client hydrate
      const container = document.createElement('div')
      container.innerHTML = html
      document.body.appendChild(container)

      const root = createRoot(container)
      await React.act(async () => {
        root.render(element)
      })

      // Assert no change requests occurred during hydration
      expect(onChange).not.toHaveBeenCalled()
      await React.act(async () => {
        root.unmount()
      })
      container.remove()
    })

    it('LB-ENV-02: Listbox should register and request exactly once across React versions and StrictMode', async () => {
      const onChange = vi.fn()
      const container = document.createElement('div')
      document.body.appendChild(container)
      const root = createRoot(container)

      function StrictFixture() {
        return React.createElement(
          React.StrictMode,
          null,
          React.createElement(
            Listbox,
            { value: 'alpha', onChange },
            React.createElement(Listbox.Option, { value: 'alpha' }, 'Alpha'),
            React.createElement(Listbox.Option, { value: 'bravo' }, 'Bravo'),
            React.createElement(Listbox.Option, { value: 'charlie' }, 'Charlie')
          )
        )
      }

      await React.act(async () => {
        root.render(React.createElement(StrictFixture, null))
      })

      // In StrictMode effects run twice, but no onChange should fire on mount
      expect(onChange).not.toHaveBeenCalled()

      const optBravo = container.querySelector('[data-value="bravo"]') as HTMLElement
      expect(optBravo).toBeTruthy()

      // Primary click -> exactly one onChange
      await React.act(async () => {
        optBravo.click()
      })
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenCalledWith('bravo')

      await React.act(async () => {
        root.unmount()
      })
      container.remove()
    })
  })

  describe('Option identity diagnostics', () => {
    it('LB-DOM-06 (unit): Listbox should preserve zero-like identities while diagnosing duplicates', async () => {
      // "" and "0" are distinct selectable identities (no truthiness coercion)
      const zeroHtml = renderToString(
        React.createElement(
          Listbox,
          { value: '', onChange: () => {} },
          React.createElement(Listbox.Option, { value: '' }, 'Empty'),
          React.createElement(Listbox.Option, { value: '0' }, 'Zero'),
          React.createElement(Listbox.Option, { value: 'alpha' }, 'Alpha')
        )
      )
      expect(zeroHtml).toContain('id="ref-opt-"')
      expect(zeroHtml).toContain('aria-selected="true"')

      const zeroSelectedHtml = renderToString(
        React.createElement(
          Listbox,
          { value: '0', onChange: () => {} },
          React.createElement(Listbox.Option, { value: '' }, 'Empty'),
          React.createElement(Listbox.Option, { value: '0' }, 'Zero')
        )
      )
      expect(zeroSelectedHtml).toContain('id="ref-opt-0"')
      expect(zeroSelectedHtml).toContain('aria-selected="true"')

      // An actual duplicate (same value under distinct ids) throws a descriptive
      // identity error before ambiguous focus or selection state is exposed
      expect(() =>
        renderToString(
          React.createElement(
            Listbox,
            { value: null, onChange: () => {} },
            React.createElement(Listbox.Option, { value: 'alpha', id: 'opt-a' }, 'Alpha'),
            React.createElement(Listbox.Option, { value: 'alpha', id: 'opt-b' }, 'Alpha again')
          )
        )
      ).toThrowError(/Duplicate option value "alpha"/)

      // Same-value options sharing one colliding derived id throw naming the
      // value at commit time (registerOption runs once per committed instance,
      // so indeterminate double-renders cannot false-positive)
      const errors: Error[] = []
      const container = document.createElement('div')
      document.body.appendChild(container)
      const root = createRoot(container)
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        await React.act(async () => {
          root.render(
            boundary(
              React.createElement(
                Listbox,
                { value: null, onChange: () => {} },
                React.createElement(Listbox.Option, { value: 'alpha' }, 'Alpha'),
                React.createElement(Listbox.Option, { value: 'alpha' }, 'Alpha again')
              ),
              errors
            )
          )
        })
      } finally {
        errSpy.mockRestore()
      }
      expect(errors.length).toBeGreaterThanOrEqual(1)
      for (const error of errors) {
        expect(error.message).toMatch(/Duplicate option value "alpha"/)
      }
      await React.act(async () => {
        root.unmount()
      })
      container.remove()
    })
  })

  describe('Combobox commit authority', () => {
    it('LB-CB-03 (unit): Listbox should reject a nested onChange inside Combobox with a two-authority diagnostic', () => {
      const fakeCombobox = { value: 'alpha' } as unknown as React.ContextType<
        typeof ComboboxContext
      >
      expect(() =>
        renderToString(
          React.createElement(
            ComboboxContext.Provider,
            { value: fakeCombobox },
            React.createElement(
              Listbox,
              { value: 'alpha', onChange: () => {} },
              React.createElement(Listbox.Option, { value: 'alpha' }, 'Alpha')
            )
          )
        )
      ).toThrowError(/cannot have an onChange handler when used inside Combobox/)

      // The valid shape (no Listbox onChange inside Combobox) renders fine
      const html = renderToString(
        React.createElement(
          ComboboxContext.Provider,
          { value: fakeCombobox },
          React.createElement(
            Listbox,
            { value: 'alpha' },
            React.createElement(Listbox.Option, { value: 'alpha' }, 'Alpha')
          )
        )
      )
      expect(html).toContain('role="listbox"')
    })
  })

  describe('Unmatched controlled value dev warnings', () => {
    let container: HTMLDivElement
    let root: ReturnType<typeof createRoot>
    let errors: unknown[][]
    let errorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
      root = createRoot(container)
      errors = []
      errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        errors.push(args)
      })
    })

    afterEach(async () => {
      errorSpy.mockRestore()
      await React.act(async () => {
        root.unmount()
      })
      container.remove()
    })

    // Only this channel's lines count; React's own console noise is not evidence here.
    function listboxWarnings() {
      return errors
        .map(args => args.map(part => String(part)).join(' '))
        .filter(text => text.startsWith('[Reference UI Listbox] '))
    }

    // Props plus plain string-valued options; the cast keeps the fixture types loose.
    const ListboxLoose = Listbox as unknown as React.FC<Record<string, unknown>>
    function listbox(props: Record<string, unknown>, values: string[]) {
      const children = values.map(value =>
        React.createElement(Listbox.Option, { key: value, value }, value)
      )
      return React.createElement(ListboxLoose, props, ...children)
    }
    const abc = ['alpha', 'bravo', 'charlie']

    it('OOR-LB-01: single-mode unmatched value warns with the exact text and selects nothing', async () => {
      await React.act(async () => {
        root.render(
          listbox({ value: 'nope', onChange: () => {} }, ['alpha', 'bravo', 'charlie'])
        )
      })
      expect(listboxWarnings()).toEqual([
        '[Reference UI Listbox] value "nope" matches no option (registered values: alpha, bravo, charlie).',
      ])
      // No clamping and no lying ARIA: nothing is aria-selected.
      expect(container.querySelectorAll('[aria-selected="true"]')).toHaveLength(0)
    })

    it('OOR-LB-02: multiple-mode unmatched entries warn once, listing every unmatched entry', async () => {
      await React.act(async () => {
        root.render(
          listbox(
            { selection: 'multiple', value: ['alpha', 'x', 'y'], onChange: () => {} },
            ['alpha', 'bravo']
          )
        )
      })
      expect(listboxWarnings()).toEqual([
        '[Reference UI Listbox] value contains "x", "y" matching no option (registered values: alpha, bravo).',
      ])
      // Matched entries stay selected; the unknown ones are kept, not clamped away.
      expect(
        container.querySelector('[data-value="alpha"]')?.getAttribute('aria-selected')
      ).toBe('true')
      expect(
        container.querySelector('[data-value="bravo"]')?.getAttribute('aria-selected')
      ).toBe('false')
    })

    it('OOR-LB-03: virtual-mode unmatched value lists the logical items, not only the mounted rows', async () => {
      const adapter: VirtualFocusAdapter = {
        items: [
          { value: 'a', textValue: 'A' },
          { value: 'b', textValue: 'B' },
          { value: 'c', textValue: 'C' },
        ],
        scrollToIndex: vi.fn(),
      }
      await React.act(async () => {
        root.render(
          React.createElement(
            Listbox,
            { value: 'zz', onChange: () => {}, virtual: adapter },
            React.createElement(Listbox.Option, { value: 'a', index: 0 }, 'A'),
            React.createElement(Listbox.Option, { value: 'b', index: 1 }, 'B')
          )
        )
      })
      expect(listboxWarnings()).toEqual([
        '[Reference UI Listbox] value "zz" matches no option (registered values: a, b, c).',
      ])
    })

    it('OOR-LB-04: virtual-mode value naming an unmounted logical item stays silent', async () => {
      const adapter: VirtualFocusAdapter = {
        items: [
          { value: 'a', textValue: 'A' },
          { value: 'b', textValue: 'B' },
          { value: 'c', textValue: 'C' },
        ],
        scrollToIndex: vi.fn(),
      }
      // Only index 0 is mounted; 'c' is a real logical item that is not rendered.
      await React.act(async () => {
        root.render(
          React.createElement(
            Listbox,
            { value: 'c', onChange: () => {}, virtual: adapter },
            React.createElement(Listbox.Option, { value: 'a', index: 0 }, 'A')
          )
        )
      })
      expect(listboxWarnings()).toEqual([])
    })

    it('OOR-LB-05: matched single, multiple, and null values stay silent', async () => {
      await React.act(async () => {
        root.render(listbox({ value: 'bravo', onChange: () => {} }, abc))
      })
      await React.act(async () => {
        root.render(listbox({ value: null, onChange: () => {} }, abc))
      })
      await React.act(async () => {
        root.render(
          listbox(
            { selection: 'multiple', value: ['alpha', 'charlie'], onChange: () => {} },
            abc
          )
        )
      })
      await React.act(async () => {
        root.render(
          listbox({ selection: 'multiple', value: [], onChange: () => {} }, abc)
        )
      })
      expect(listboxWarnings()).toEqual([])
      expect(
        container.querySelector('[data-value="charlie"]')?.getAttribute('aria-selected')
      ).toBe('false')
    })

    it('OOR-LB-06: a normal mount with a matched value stays silent, StrictMode included', async () => {
      await React.act(async () => {
        root.render(listbox({ value: 'alpha', onChange: () => {} }, abc))
      })
      expect(listboxWarnings()).toEqual([])

      await React.act(async () => {
        root.render(
          React.createElement(
            React.StrictMode,
            null,
            listbox({ value: 'alpha', onChange: () => {} }, abc)
          )
        )
      })
      expect(listboxWarnings()).toEqual([])
    })

    it('OOR-LB-07: options that resolve later never warn on an empty registry, then warn once they arrive without the value', async () => {
      await React.act(async () => {
        root.render(listbox({ value: 'delta', onChange: () => {} }, []))
      })
      expect(listboxWarnings()).toEqual([])

      await React.act(async () => {
        root.render(listbox({ value: 'delta', onChange: () => {} }, ['alpha', 'bravo']))
      })
      expect(listboxWarnings()).toEqual([
        '[Reference UI Listbox] value "delta" matches no option (registered values: alpha, bravo).',
      ])

      // Once the value resolves to a registered option, the verdict clears silently.
      await React.act(async () => {
        root.render(
          listbox({ value: 'delta', onChange: () => {} }, ['alpha', 'bravo', 'delta'])
        )
      })
      expect(listboxWarnings()).toHaveLength(1)
    })

    it('OOR-LB-08: warns once per distinct offending value across StrictMode and re-renders', async () => {
      const strict = (props: Record<string, unknown>) =>
        React.createElement(React.StrictMode, null, listbox(props, abc))

      await React.act(async () => {
        root.render(strict({ value: 'nope', onChange: () => {} }))
      })
      expect(listboxWarnings()).toHaveLength(1)

      // A parent re-render with the same unmatched value (fresh props) does not repeat it.
      await React.act(async () => {
        root.render(strict({ value: 'nope', onChange: () => {}, className: 'again' }))
      })
      expect(listboxWarnings()).toHaveLength(1)

      // A different unmatched value is a new verdict and warns again.
      await React.act(async () => {
        root.render(strict({ value: 'nope-2', onChange: () => {} }))
      })
      expect(listboxWarnings()).toEqual([
        '[Reference UI Listbox] value "nope" matches no option (registered values: alpha, bravo, charlie).',
        '[Reference UI Listbox] value "nope-2" matches no option (registered values: alpha, bravo, charlie).',
      ])
    })

    it('OOR-LB-09: uncontrolled and Combobox-owned values stay silent', async () => {
      await React.act(async () => {
        root.render(listbox({ onChange: () => {} }, ['alpha', 'bravo']))
      })
      // Uncontrolled multiple is left out: its omitted-value default is a fresh [] on
      // every render, which re-registers options in a render loop that predates this check.
      expect(listboxWarnings()).toEqual([])

      // Inside Combobox the value is combobox.value, which Combobox reports, not Listbox.
      const fakeCombobox = {
        value: 'nope',
        activeValue: null,
        activeOptionId: null,
      } as unknown as React.ContextType<typeof ComboboxContext>
      await React.act(async () => {
        root.render(
          React.createElement(
            ComboboxContext.Provider,
            { value: fakeCombobox },
            listbox({ value: 'nope' }, ['alpha', 'bravo'])
          )
        )
      })
      expect(listboxWarnings()).toEqual([])
    })
  })
})

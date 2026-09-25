// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import {
  Listbox,
  validateVirtualAdapter,
  computeNextMultipleSelection,
  type VirtualFocusAdapter,
  type ListboxProps,
  type ListboxOptionProps,
} from './index'
import { ComboboxContext } from '../Combobox/combobox-context'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

describe('Listbox Unit Contract', () => {
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
    it('LB-DOM-06 (unit): Listbox should preserve zero-like identities while diagnosing duplicates', () => {
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
})

// @vitest-environment happy-dom
import * as React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import {
  Splitter,
  type SplitterHandleProps,
  type SplitterPanelProps,
  type SplitterProps,
} from './index'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Splitter contract', () => {
  it('SP-TYPE-01: Splitter should preserve resize callback, constraint, and controlled types on the v1 API', () => {
    // 1. Valid compilation of Root with REQUIRED controlled value, typed
    // callbacks, orientation. No defaultValue, no Root disabled.
    const validProps: SplitterProps = {
      value: [40, 60],
      onChange: (val: number[]) => {
        expect(Array.isArray(val)).toBe(true)
      },
      onChangeEnd: (val: number[]) => {
        expect(Array.isArray(val)).toBe(true)
      },
      orientation: 'horizontal',
      width: '100%',
      height: '300px',
    }
    expect(validProps.value).toEqual([40, 60])

    expectTypeOf(validProps.value).toEqualTypeOf<number[]>()
    expectTypeOf(validProps.orientation).toEqualTypeOf<'horizontal' | 'vertical' | undefined>()

    // 2. Valid compilation of Panel with numeric or CSS-string constraints
    // (numbers drive the solver live; strings resolve post-mount).
    const validPanelProps: SplitterPanelProps = {
      min: 20,
      max: '320px',
      collapsible: true,
      collapsedSize: 5,
      p: '2r',
    }
    expect(validPanelProps.collapsible).toBe(true)
    expectTypeOf(validPanelProps.min).toEqualTypeOf<number | string | undefined>()
    expectTypeOf(validPanelProps.max).toEqualTypeOf<number | string | undefined>()

    // 3. Valid compilation of Handle with per-Handle disabled and withThumb.
    const validHandleProps: SplitterHandleProps = {
      disabled: false,
      withThumb: true,
    }
    expect(validHandleProps.disabled).toBe(false)

    // 4. Element compilation check: order is DOM order, no index props.
    const el = (
      <Splitter {...validProps}>
        <Splitter.Panel {...validPanelProps}>Left</Splitter.Panel>
        <Splitter.Handle {...validHandleProps} />
        <Splitter.Panel>Right</Splitter.Panel>
      </Splitter>
    )
    expect(React.isValidElement(el)).toBe(true)

    // 5. Type failure assertions:
    // @ts-expect-error - value is required
    const _missingValue: SplitterProps = { onChange: () => {} }

    // @ts-expect-error - value must be number[], not scalar
    const _invalidScalarValue: SplitterProps = { value: 50 }

    // @ts-expect-error - uncontrolled defaultValue is deleted
    const _deletedDefaultValue: SplitterProps = { value: [50, 50], defaultValue: [50, 50] }

    // @ts-expect-error - Root disabled is deleted (per-Handle only)
    const _deletedRootDisabled: SplitterProps = { value: [50, 50], disabled: true }

    // @ts-expect-error - Root display is owned by the kernel
    const _ownedDisplay: SplitterProps = { value: [50, 50], display: 'grid' }

    // @ts-expect-error - Root flexDirection is owned by the kernel
    const _ownedFlexDirection: SplitterProps = { value: [50, 50], flexDirection: 'column' }

    // @ts-expect-error - onChange must accept number[], not an event
    const _invalidOnChange: SplitterProps = { value: [50, 50], onChange: (e: React.FormEvent) => {} }

    // @ts-expect-error - invalid orientation literal
    const _invalidOrientation: SplitterProps = { value: [50, 50], orientation: 'diagonal' }

    // @ts-expect-error - Panel index is deleted (order is DOM order)
    const _deletedPanelIndex: SplitterPanelProps = { index: 0 }

    // @ts-expect-error - Handle index is deleted (order is DOM order)
    const _deletedHandleIndex: SplitterHandleProps = { index: 0 }

    // @ts-expect-error - Panel flex is owned by the kernel
    const _ownedPanelFlex: SplitterPanelProps = { flex: '1 1 auto' }

    // @ts-expect-error - Panel flexGrow is owned by the kernel
    const _ownedPanelFlexGrow: SplitterPanelProps = { flexGrow: 1 }

    // @ts-expect-error - Panel flexShrink is owned by the kernel
    const _ownedPanelFlexShrink: SplitterPanelProps = { flexShrink: 0 }

    // @ts-expect-error - Panel flexBasis is owned by the kernel
    const _ownedPanelFlexBasis: SplitterPanelProps = { flexBasis: '10%' }

    // @ts-expect-error - Handle flex is owned by the kernel
    const _ownedHandleFlex: SplitterHandleProps = { flex: '0 0 auto' }

    void _missingValue
    void _invalidScalarValue
    void _deletedDefaultValue
    void _deletedRootDisabled
    void _ownedDisplay
    void _ownedFlexDirection
    void _invalidOnChange
    void _invalidOrientation
    void _deletedPanelIndex
    void _deletedHandleIndex
    void _ownedPanelFlex
    void _ownedPanelFlexGrow
    void _ownedPanelFlexShrink
    void _ownedPanelFlexBasis
    void _ownedHandleFlex
  })

  it('SP-ENV-01: Splitter should server-render safe fallback geometry and separator ARIA when order cannot be measured', () => {
    const errors: string[] = []
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    try {
      const html = renderToString(
        <Splitter value={[40, 60]}>
          <Splitter.Panel>Left</Splitter.Panel>
          <Splitter.Handle aria-label="Resize panels" />
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      )
      // Order is unknown without a DOM: Panels render the 50 fallback and the
      // separator renders the safe range. Client layout effects correct both
      // before paint, so server and first client frame agree.
      expect(html).toContain('role="separator"')
      expect(html).toContain('aria-valuenow="50"')
      expect(html).toContain('aria-valuemin="0"')
      expect(html).toContain('aria-valuemax="100"')
      expect(html).toContain('--reference-splitter-panel-size:50%')
      expect(html).toContain('--reference-splitter-1:40%')
      expect(html).toContain('--reference-splitter-2:60%')
      expect(html).not.toContain('flex-basis')
      expect(html).not.toContain('data-disabled')
      expect(errors).toEqual([])
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('SP-ENV-01: Splitter should server-render measured strings unconstrained without warnings or layout reads', () => {
    const errors: string[] = []
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '))
    })
    try {
      // FEATURES #3: SSR emits unconstrained — resolution waits for mount.
      const html = renderToString(
        <Splitter value={[40, 60]}>
          <Splitter.Panel min="120px" max="10rem">
            Left
          </Splitter.Panel>
          <Splitter.Handle aria-label="Resize panels" />
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      )
      expect(html).toContain('--reference-splitter-panel-size:50%')
      expect(html).toContain('aria-valuenow="50"')
      expect(errors).toEqual([])
    } finally {
      errorSpy.mockRestore()
    }
  })

  describe('SP-ENV-01: registration resolves order and constraints on the client', () => {
    let container: HTMLDivElement | null = null
    let root: ReturnType<typeof createRoot> | null = null

    afterEach(() => {
      if (root) {
        try {
          act(() => root!.unmount())
        } catch {
          // Roots left errored by throw-pinning tests have nothing to unmount.
        }
        root = null
      }
      container?.remove()
      container = null
      vi.restoreAllMocks()
    })

    function mount(node: React.ReactElement) {
      container = document.createElement('div')
      document.body.appendChild(container)
      root = createRoot(container)
      act(() => {
        root!.render(node)
      })
      return container
    }

    it('assigns sizes and honest ARIA in DOM order with numeric constraints', () => {
      const el = mount(
        <Splitter value={[40, 60]}>
          <Splitter.Panel min={20}>Left</Splitter.Panel>
          <Splitter.Handle aria-label="Resize panels" />
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      )
      const panels = el.querySelectorAll('[data-reference-splitter-panel]')
      expect(
        (panels[0] as HTMLElement)?.style.getPropertyValue('--reference-splitter-panel-size')
      ).toBe('40%')
      expect(
        (panels[1] as HTMLElement)?.style.getPropertyValue('--reference-splitter-panel-size')
      ).toBe('60%')
      expect((panels[0] as HTMLElement)?.style.flex).toContain('var(--reference-splitter-panel-size)')
      const root = el.querySelector('[data-reference-splitter]') as HTMLElement
      expect(root?.style.getPropertyValue('--reference-splitter-1')).toBe('40%')
      expect(root?.style.getPropertyValue('--reference-splitter-2')).toBe('60%')
      const handle = el.querySelector('[role="separator"]')
      expect(handle?.getAttribute('aria-valuenow')).toBe('40')
      expect(handle?.getAttribute('aria-valuemin')).toBe('20')
      expect(handle?.getAttribute('aria-valuemax')).toBe('95')
    })

    it('defers valid measured strings silently to default bounds when unmeasurable', () => {
      const errors: string[] = []
      vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        errors.push(args.map(String).join(' '))
      })
      // happy-dom reports zero sizes: valid strings wait for measurement,
      // the solver still receives numerics (no NaN), and nothing warns.
      const el = mount(
        <Splitter value={[40, 60]}>
          <Splitter.Panel min="120px" max="450px">
            Left
          </Splitter.Panel>
          <Splitter.Handle aria-label="Resize panels" />
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      )
      const handle = el.querySelector('[role="separator"]')
      expect(handle?.getAttribute('aria-valuenow')).toBe('40')
      expect(handle?.getAttribute('aria-valuemin')).toBe('5')
      expect(handle?.getAttribute('aria-valuemax')).toBe('95')
      expect(errors).toEqual([])
    })

    it('W-35: off-100 layouts dev-warn naming component, prop, value, and range instead of silently collapsing', () => {
      const errors: string[] = []
      vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        errors.push(args.map(String).join(' '))
      })
      // B-11 shape (entries that do not sum to 100): loud in dev, and both
      // panels still mount with their declared sizes — never a silent 13px
      // collapse.
      const el = mount(
        <Splitter value={[30, 30]}>
          <Splitter.Panel>Left</Splitter.Panel>
          <Splitter.Handle aria-label="Resize panels" />
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      )
      expect(
        errors.some(
          (line) =>
            line.includes('Splitter') &&
            line.includes('value') &&
            line.includes('60.00%') &&
            line.includes('100%')
        )
      ).toBe(true)
      const panels = el.querySelectorAll('[data-reference-splitter-panel]')
      expect(panels.length).toBe(2)
      expect(
        (panels[0] as HTMLElement)?.style.getPropertyValue('--reference-splitter-panel-size')
      ).toBe('30%')
      expect(
        (panels[1] as HTMLElement)?.style.getPropertyValue('--reference-splitter-panel-size')
      ).toBe('30%')
    })

    it('W-35: value/Panel count mismatch dev-warns and throws (never a silent collapse)', () => {
      const errors: string[] = []
      vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        errors.push(args.map(String).join(' '))
      })
      // The exact B-11 instance: 3 value entries on 2 Panels. FEATURES #9
      // throws; W-35 adds the dev warning carrying the same diagnostic.
      expect(() =>
        mount(
          <Splitter value={[10, 10, 80]}>
            <Splitter.Panel>Left</Splitter.Panel>
            <Splitter.Handle aria-label="Resize panels" />
            <Splitter.Panel>Right</Splitter.Panel>
          </Splitter>
        )
      ).toThrow(/value has 3 entries but 2 Panels are mounted/)
      expect(
        errors.some(
          (line) =>
            line.includes('Splitter') &&
            line.includes('value has 3 entries') &&
            line.includes('2 Panels')
        )
      ).toBe(true)
    })

    it('warns with a property-specific diagnostic and ignores unparsable measured strings', () => {
      const errors: string[] = []
      vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        errors.push(args.map(String).join(' '))
      })
      const el = mount(
        <Splitter value={[40, 60]}>
          <Splitter.Panel min="bogus" max="450px">
            Left
          </Splitter.Panel>
          <Splitter.Handle aria-label="Resize panels" />
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      )
      // Parse failure: dev diagnostic plus the default bound, never NaN.
      expect(errors.some((line) => line.includes('invalid measured min length'))).toBe(true)
      const handle = el.querySelector('[role="separator"]')
      expect(handle?.getAttribute('aria-valuemin')).toBe('5')
      expect(handle?.getAttribute('aria-valuemax')).toBe('95')
    })

    it('B-28 REOPENED: legacy minSize/maxSize/index never leak to css() or the DOM', () => {
      // Pre-rename call sites still pass minSize/maxSize/index. The names
      // collide with the CSS min-size/max-size style props, so without the
      // destructure they flow ...props → Div → css() ("no compiled class
      // for minSize: 10") or land on the DOM as unknown attributes.
      const errors: string[] = []
      const warnings: string[] = []
      vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
        errors.push(args.map(String).join(' '))
      })
      vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
        warnings.push(args.map(String).join(' '))
      })
      // `index` is a deleted prop (a type error by design) — the spread
      // keeps the fixture compiling while proving the runtime strips it.
      const el = mount(
        <Splitter value={[40, 60]}>
          <Splitter.Panel minSize={10} maxSize={90} {...{ index: 0 }}>
            Left
          </Splitter.Panel>
          <Splitter.Handle aria-label="Resize panels" {...{ index: 0 }} />
          <Splitter.Panel {...{ index: 1 }}>Right</Splitter.Panel>
        </Splitter>
      )
      // Legacy aliases still drive the solver: minSize=10/maxSize=90 bind
      // the separator range.
      const handle = el.querySelector('[role="separator"]')
      expect(handle?.getAttribute('aria-valuemin')).toBe('10')
      expect(handle?.getAttribute('aria-valuemax')).toBe('90')
      // Zero DOM leak on Panels and the Handle.
      for (const node of el.querySelectorAll(
        '[data-reference-splitter-panel], [role="separator"]'
      )) {
        for (const name of ['minsize', 'maxsize', 'index']) {
          expect(node.hasAttribute(name)).toBe(false)
        }
      }
      // Zero css() miss-spam for the legacy names.
      const leak = /minSize|maxSize|collapsible|collapsedSize/
      expect(errors.filter((line) => leak.test(line))).toEqual([])
      expect(warnings.filter((line) => leak.test(line))).toEqual([])
    })

    it('B-28 REOPENED: min/max win over legacy minSize/maxSize when both are set', () => {
      const el = mount(
        <Splitter value={[40, 60]}>
          <Splitter.Panel min={20} max={60} minSize={10} maxSize={90}>
            Left
          </Splitter.Panel>
          <Splitter.Handle aria-label="Resize panels" />
          <Splitter.Panel>Right</Splitter.Panel>
        </Splitter>
      )
      const handle = el.querySelector('[role="separator"]')
      expect(handle?.getAttribute('aria-valuemin')).toBe('20')
      expect(handle?.getAttribute('aria-valuemax')).toBe('60')
    })
  })
})

// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  Splitter,
  type SplitterHandleProps,
  type SplitterPanelProps,
  type SplitterProps,
} from './index'

describe('Splitter contract', () => {
  it('SP-TYPE-01: Splitter should preserve resize callback, constraint, and uncontrolled types on the current API', () => {
    // 1. Valid compilation of Root with controlled value, typed callbacks, orientation, disabled.
    // Root `disabled` is valid here: quarantine's Handle-only freeze is deliberately not ported.
    const validProps: SplitterProps = {
      value: [40, 60],
      onChange: (val: number[]) => {
        expect(Array.isArray(val)).toBe(true)
      },
      onChangeEnd: (val: number[]) => {
        expect(Array.isArray(val)).toBe(true)
      },
      orientation: 'horizontal',
      disabled: false,
      width: '100%',
      height: '300px',
    }
    expect(validProps.value).toEqual([40, 60])

    expectTypeOf(validProps.value).toEqualTypeOf<number[] | undefined>()
    expectTypeOf(validProps.defaultValue).toEqualTypeOf<number[] | undefined>()
    expectTypeOf(validProps.orientation).toEqualTypeOf<'horizontal' | 'vertical' | undefined>()
    expectTypeOf(validProps.disabled).toEqualTypeOf<boolean | undefined>()

    // Uncontrolled mode is retained on this branch (quarantine's controlled-only
    // freeze is deliberately not ported): value stays optional and defaultValue compiles.
    const uncontrolledProps: SplitterProps = { defaultValue: [40, 60] }
    expect(uncontrolledProps.defaultValue).toEqual([40, 60])
    const emptyProps: SplitterProps = {}
    expect(emptyProps.value).toBeUndefined()

    // 2. Valid compilation of Panel with numeric constraints (numbers only: the
    // freeze `min`/`max` rename and CSS-length constraints are not ported).
    const validPanelProps: SplitterPanelProps = {
      index: 0,
      minSize: 20,
      maxSize: 80,
      collapsible: true,
      collapsedSize: 5,
      p: '2r',
    }
    expect(validPanelProps.collapsible).toBe(true)

    // 3. Valid compilation of Handle with index, disabled, withThumb.
    const validHandleProps: SplitterHandleProps = {
      index: 0,
      disabled: false,
      withThumb: true,
    }
    expect(validHandleProps.disabled).toBe(false)

    // 4. Element compilation check.
    const el = (
      <Splitter {...validProps}>
        <Splitter.Panel {...validPanelProps}>Left</Splitter.Panel>
        <Splitter.Handle {...validHandleProps} />
        <Splitter.Panel index={1}>Right</Splitter.Panel>
      </Splitter>
    )
    expect(React.isValidElement(el)).toBe(true)

    // 5. Type failure assertions:
    // @ts-expect-error - value must be number[], not scalar
    const _invalidScalarValue: SplitterProps = { value: 50 }

    // @ts-expect-error - onChange must accept number[], not an event
    const _invalidOnChange: SplitterProps = { value: [50, 50], onChange: (e: React.FormEvent) => {} }

    // @ts-expect-error - invalid orientation literal
    const _invalidOrientation: SplitterProps = { value: [50, 50], orientation: 'diagonal' }

    // @ts-expect-error - minSize is numeric on this branch, not a CSS length
    const _invalidMinLength: SplitterPanelProps = { minSize: '12r' }

    void _invalidScalarValue
    void _invalidOnChange
    void _invalidOrientation
    void _invalidMinLength
  })

  it('SP-ENV-01: Splitter should server-render panels and honest separator ARIA when layout cannot be measured', () => {
    const html = renderToString(
      <Splitter value={[40, 60]}>
        <Splitter.Panel index={0}>Left</Splitter.Panel>
        <Splitter.Handle index={0} aria-label="Resize panels" />
        <Splitter.Panel index={1}>Right</Splitter.Panel>
      </Splitter>
    )
    expect(html).toContain('role="separator"')
    expect(html).toContain('aria-valuenow="40"')
    expect(html).toContain('aria-valuemin="5"')
    expect(html).toContain('aria-valuemax="95"')
    expect(html).toContain('flex-basis:40%')
    expect(html).toContain('flex-basis:60%')
  })
})

// @vitest-environment happy-dom
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  Slider,
  type SliderProps,
  type SliderThumbProps,
  type SliderValue,
} from './index'

describe('Slider contract', () => {
  it('SD-TYPE-01: Slider should preserve behavior-prop types when ReferencePartProps also supplies StyleProps', () => {
    // 1. Valid compilation of Root with behavior props, StyleProps, css, and responsive r
    const validProps: SliderProps = {
      value: 50,
      min: 0,
      max: 100,
      step: 0.25,
      minStepsBetweenThumbs: 3,
      orientation: 'vertical',
      disabled: false,
      onChange: (value: SliderValue) => void value,
      onChangeEnd: (value: SliderValue) => void value,
      minWidth: '20r',
      css: { opacity: 0.5 },
      r: { 320: { minWidth: '30r' } },
    }

    expectTypeOf(validProps.min).toEqualTypeOf<number | undefined>()
    expectTypeOf(validProps.max).toEqualTypeOf<number | undefined>()
    expectTypeOf(validProps.step).toEqualTypeOf<number | undefined>()
    expectTypeOf(validProps.minStepsBetweenThumbs).toEqualTypeOf<number | undefined>()
    expectTypeOf(validProps.orientation).toEqualTypeOf<'horizontal' | 'vertical' | undefined>()
    expectTypeOf(validProps.disabled).toEqualTypeOf<boolean | undefined>()
    expectTypeOf(validProps.value).toEqualTypeOf<SliderValue>()

    // Controlled-only: value is required and defaultValue does not exist.
    // @ts-expect-error - value is required
    const _missingValue: SliderProps = {}
    // @ts-expect-error - defaultValue was stripped (controlled-only)
    const _defaultValue: SliderProps = { value: 0, defaultValue: 0 }
    void _missingValue
    void _defaultValue

    // Generic inference keeps scalar and range handlers distinct.
    expectTypeOf<SliderProps<number>['onChange']>().toEqualTypeOf<((value: number) => void) | undefined>()
    expectTypeOf<SliderProps<number[]>['onChange']>().toEqualTypeOf<((value: number[]) => void) | undefined>()

    // 2. Valid compilation of Slider.Thumb with StyleProps (auto identity:
    // no index prop)
    const validThumbProps: SliderThumbProps = {
      width: '2r',
      bg: 'ui.progress.bar.foreground',
    }
    expect(validThumbProps.width).toBe('2r')
    // @ts-expect-error - index was stripped (auto mount-order identity)
    const _thumbIndex: SliderThumbProps = { index: 0 }
    void _thumbIndex

    // 3. Compile element with Slider and its sub-parts
    const element = (
      <Slider {...validProps}>
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb {...validThumbProps} />
        </Slider.Track>
      </Slider>
    )
    expect(React.isValidElement(element)).toBe(true)

    // 4. Type assertions via TypeScript checks:
    // @ts-expect-error - minStepsBetweenThumbs="3" must fail (string not number)
    const _invalidMinStepsStr: SliderProps = { value: 0, minStepsBetweenThumbs: '3' }

    // @ts-expect-error - minStepsBetweenThumbs as an array must fail
    const _invalidMinStepsArr: SliderProps = { value: 0, minStepsBetweenThumbs: [3] }

    // @ts-expect-error - minStepsBetweenThumbs as bigint must fail
    const _invalidMinStepsBigInt: SliderProps = { value: 0, minStepsBetweenThumbs: 3n }

    void _invalidMinStepsStr
    void _invalidMinStepsArr
    void _invalidMinStepsBigInt
  })

  it('SD-ENV-01: Slider should server-render value-derived ARIA and percentages when layout cannot be read', () => {
    // Server-render scalar 30
    const scalarHtml = renderToString(
      <Slider value={30} min={0} max={100}>
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb aria-label="Volume" />
        </Slider.Track>
      </Slider>
    )
    expect(scalarHtml).toContain('role="slider"')
    expect(scalarHtml).toContain('aria-valuenow="30"')
    expect(scalarHtml).toContain('aria-valuemin="0"')
    expect(scalarHtml).toContain('aria-valuemax="100"')
    expect(scalarHtml).toContain('--reference-slider-thumb-position:30%')
    expect(scalarHtml).toContain('--reference-slider-range-start:0%')
    expect(scalarHtml).toContain('--reference-slider-range-end:30%')

    // Server-render range [20, 70]
    const rangeHtml = renderToString(
      <Slider value={[20, 70]} min={0} max={100}>
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb aria-label="Min" />
          <Slider.Thumb aria-label="Max" />
        </Slider.Track>
      </Slider>
    )
    expect(rangeHtml).toContain('aria-valuenow="20"')
    expect(rangeHtml).toContain('aria-valuenow="70"')
    expect(rangeHtml).toContain('--reference-slider-range-start:20%')
    expect(rangeHtml).toContain('--reference-slider-range-end:70%')
    expect(rangeHtml).toContain('--reference-slider-thumb-position:20%')
    expect(rangeHtml).toContain('--reference-slider-thumb-position:70%')
  })

  it('B-29: Slider should clamp ARIA to the feasible window when the controlled value is out of range', () => {
    // Overflow: visual sits at 100% and ARIA agrees (was: aria-valuenow=999).
    const overflowHtml = renderToString(
      <Slider value={999} min={0} max={24}>
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb aria-label="Overflow" />
        </Slider.Track>
      </Slider>
    )
    expect(overflowHtml).toContain('aria-valuenow="24"')
    expect(overflowHtml).toContain('aria-valuemin="0"')
    expect(overflowHtml).toContain('aria-valuemax="24"')
    expect(overflowHtml).not.toContain('aria-valuenow="999"')
    expect(overflowHtml).toContain('--reference-slider-thumb-position:100%')

    // Underflow mirrors.
    const underflowHtml = renderToString(
      <Slider value={-40} min={0} max={24}>
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb aria-label="Underflow" />
        </Slider.Track>
      </Slider>
    )
    expect(underflowHtml).toContain('aria-valuenow="0"')
    expect(underflowHtml).toContain('--reference-slider-thumb-position:0%')

    // Range overflow clamps every thumb into the global window.
    const rangeHtml = renderToString(
      <Slider value={[999, 1000]} min={0} max={24}>
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb aria-label="Min" />
          <Slider.Thumb aria-label="Max" />
        </Slider.Track>
      </Slider>
    )
    expect(rangeHtml).not.toContain('aria-valuenow="999"')
    expect(rangeHtml).not.toContain('aria-valuenow="1000"')
    expect(rangeHtml.match(/aria-valuenow="24"/g)).toHaveLength(2)
  })
})

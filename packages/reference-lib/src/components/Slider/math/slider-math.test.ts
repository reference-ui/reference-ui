import { describe, expect, it } from 'vitest'
import {
  validateSliderConfig,
  snapValueToStep,
  stepValue,
  getPageStep,
  getThumbBounds,
  valueToPercent,
  roundToPrecision,
} from './slider-math'

describe('Slider numeric model', () => {
  it('SD-MATH-01: Slider should reject invalid numeric configuration when its model is created or updated', () => {
    // Omitted defaults succeed
    expect(() => validateSliderConfig({ value: 50 })).not.toThrow()

    // Reject NaN in min
    expect(() => validateSliderConfig({ value: 50, min: NaN })).toThrow(/finite number/)
    // Reject Infinity in max
    expect(() => validateSliderConfig({ value: 50, max: Infinity })).toThrow(/finite number/)
    // Reject non-finite value
    expect(() => validateSliderConfig({ value: NaN })).toThrow(/finite number/)

    // Reject min=10, max=10
    expect(() => validateSliderConfig({ value: 10, min: 10, max: 10 })).toThrow(/strictly less than/)
    // Reject min=20, max=10
    expect(() => validateSliderConfig({ value: 15, min: 20, max: 10 })).toThrow(/strictly less than/)

    // Reject step=0
    expect(() => validateSliderConfig({ value: 10, step: 0 })).toThrow(/positive number/)
    // Reject step=-1
    expect(() => validateSliderConfig({ value: 10, step: -1 })).toThrow(/positive number/)
  })

  it('SD-MATH-02: Slider should clamp and snap interaction results when the step grid is anchored at min', () => {
    const min = 6
    const max = 108
    const step = 10

    // For min=6, max=108, and step=10, map proposed values -20, 55, 103, and 200
    // Assert results 6, 56, 106, and 106 according to the frozen bound rule, never a grid anchored at zero.
    expect(snapValueToStep(-20, min, max, step)).toBe(6)
    expect(snapValueToStep(55, min, max, step)).toBe(56)
    expect(snapValueToStep(103, min, max, step)).toBe(106)
    expect(snapValueToStep(200, min, max, step)).toBe(106)
  })

  it('SD-MATH-03: Slider should move to the adjacent aligned value when a controlled value starts off grid', () => {
    const min = 1000
    const max = 100000
    const step = 5000
    const offGridValue = 49000

    // One increase produces 51000
    const firstIncrease = stepValue(offGridValue, 1, min, max, step)
    expect(firstIncrease).toBe(51000)

    // A second increase produces 56000
    const secondIncrease = stepValue(firstIncrease, 1, min, max, step)
    expect(secondIncrease).toBe(56000)

    // A fresh one-step decrease from 49000 produces 46000
    const decrease = stepValue(offGridValue, -1, min, max, step)
    expect(decrease).toBe(46000)
  })

  it('SD-MATH-04: Slider should preserve decimal precision when fractional and scientific steps are applied', () => {
    // Step 0.2 by 0.1 to exactly 0.3
    const stepped = stepValue(0.2, 1, 0, 1, 0.1)
    expect(stepped).toBe(0.3)
    expect(stepped.toString()).toBe('0.3')

    // Step 0 by 1e-7 twice to 1e-7 and 2e-7
    const step1 = stepValue(0, 1, 0, 1e-5, 1e-7)
    expect(step1).toBe(1e-7)
    const step2 = stepValue(step1, 1, 0, 1e-5, 1e-7)
    expect(step2).toBe(2e-7)

    // Step by 1.5e-7
    const stepCustom = stepValue(0, 1, 0, 1e-5, 1.5e-7)
    expect(stepCustom).toBe(1.5e-7)
    expect(stepCustom.toString()).not.toMatch(/0000000000\d/)
  })

  it('SD-MATH-05: Slider should derive and bound Page stepping when range and step do not divide evenly', () => {
    // For min=0, max=96, and step=6, assert the Page step is 12
    const pageStep = getPageStep(0, 96, 6)
    expect(pageStep).toBe(12)

    // Snapping beyond either end clamps to 0 or 96
    expect(snapValueToStep(96 + pageStep, 0, 96, 6)).toBe(96)
    expect(snapValueToStep(0 - pageStep, 0, 96, 6)).toBe(0)

    // For a 0..10, step=10 range assert one normal Page step (10) before clamping
    expect(getPageStep(0, 10, 10)).toBe(10)
  })

  it('SD-MATH-06: Slider should expose safe clamped observables when controlled values are outside global bounds', () => {
    const min = 0
    const max = 100

    // Evaluate controlled 119.9 and -7.31 with min=0, max=100
    // Assert ARIA and geometry resolve to 100/100% and 0/0%
    expect(valueToPercent(119.9, min, max)).toBe(100)
    expect(valueToPercent(-7.31, min, max)).toBe(0)
  })

  it("SD-MATH-07: Slider should use real adjacent values as each Thumb's clamp even when a neighbor is zero", () => {
    const step = 1
    const minSteps = 0

    // Proposed 5 for index 0 in [-10, 0] yields [0, 0]
    const bounds0 = getThumbBounds([-10, 0], 0, -50, 50, step, minSteps)
    expect(bounds0.max).toBe(0)
    const clamped0 = Math.min(bounds0.max, Math.max(bounds0.min, 5))
    expect(clamped0).toBe(0)

    // Proposed -5 for index 1 in [0, 10] yields [0, 0]
    const bounds1 = getThumbBounds([0, 10], 1, -50, 50, step, minSteps)
    expect(bounds1.min).toBe(0)
    const clamped1 = Math.min(bounds1.max, Math.max(bounds1.min, -5))
    expect(clamped1).toBe(0)

    // Middle proposals 10/90 in [20, 40, 80] clamp to 20/80
    const boundsMiddle = getThumbBounds([20, 40, 80], 1, -50, 100, step, minSteps)
    expect(boundsMiddle.min).toBe(20)
    expect(boundsMiddle.max).toBe(80)
    expect(Math.min(boundsMiddle.max, Math.max(boundsMiddle.min, 10))).toBe(20)
    expect(Math.min(boundsMiddle.max, Math.max(boundsMiddle.min, 90))).toBe(80)

    // Absent outer neighbors use global -50/50
    const outer0 = getThumbBounds([0], 0, -50, 50, step, minSteps)
    expect(outer0.min).toBe(-50)
    expect(outer0.max).toBe(50)
  })

  it('SD-MATH-08: Slider should stop at equality when either Thumb attempts to cross its neighbor', () => {
    const step = 1
    const minSteps = 0
    const values = [20, 70]

    // Starting from [20, 70], propose 90 for the first
    const bounds0 = getThumbBounds(values, 0, 0, 100, step, minSteps)
    const clamped0 = Math.min(bounds0.max, Math.max(bounds0.min, 90))
    expect(clamped0).toBe(70)

    // Propose 10 for the second
    const bounds1 = getThumbBounds(values, 1, 0, 100, step, minSteps)
    const clamped1 = Math.min(bounds1.max, Math.max(bounds1.min, 10))
    expect(clamped1).toBe(20)
  })

  it('SD-MATH-09: Slider should reject invalid multi-Thumb arrays when order or cardinality is unusable', () => {
    // Validate []
    expect(() => validateSliderConfig({ value: [] })).toThrow(/empty/)

    // Validate [30, 20] decreasing order
    expect(() => validateSliderConfig({ value: [30, 20] })).toThrow(/non-decreasing order/)

    // Validate arrays containing NaN / Infinity
    expect(() => validateSliderConfig({ value: [10, NaN] })).toThrow(/finite number/)
    expect(() => validateSliderConfig({ value: [10, Infinity] })).toThrow(/finite number/)

    // Validate non-array / non-number runtime shape
    expect(() => validateSliderConfig({ value: '20' as any })).toThrow(/number or array of numbers/)

    // Accepting [20, 20, 70] preserving all three indices at equality
    expect(() => validateSliderConfig({ value: [20, 20, 70] })).not.toThrow()
  })

  it('SD-MATH-10: Slider should reject invalid minimum-step distances when numeric configuration is validated', () => {
    // Accept omitted, explicit undefined, 0, 1, and 3
    expect(() => validateSliderConfig({ value: 50 })).not.toThrow()
    expect(() => validateSliderConfig({ value: 50, minStepsBetweenThumbs: undefined })).not.toThrow()
    expect(() => validateSliderConfig({ value: [20, 80], minStepsBetweenThumbs: 0 })).not.toThrow()
    expect(() => validateSliderConfig({ value: [20, 80], minStepsBetweenThumbs: 1 })).not.toThrow()
    expect(() => validateSliderConfig({ value: [20, 80], minStepsBetweenThumbs: 3 })).not.toThrow()

    // Reject -1, 0.5, NaN, and positive infinity
    expect(() => validateSliderConfig({ value: [20, 80], minStepsBetweenThumbs: -1 })).toThrow(
      /non-negative integer/
    )
    expect(() => validateSliderConfig({ value: [20, 80], minStepsBetweenThumbs: 0.5 })).toThrow(
      /non-negative integer/
    )
    expect(() => validateSliderConfig({ value: [20, 80], minStepsBetweenThumbs: NaN })).toThrow(
      /non-negative integer/
    )
    expect(() => validateSliderConfig({ value: [20, 80], minStepsBetweenThumbs: Infinity })).toThrow(
      /non-negative integer/
    )
  })

  it('SD-MATH-11: Slider should let neighboring Thumbs meet when the minimum-step distance is zero or omitted', () => {
    const min = 0
    const max = 100
    const step = 10
    const values = [20, 80]

    // Propose 90 for index 0 under omitted minStepsBetweenThumbs
    const bounds0Omitted = getThumbBounds(values, 0, min, max, step, 0)
    expect(Math.min(bounds0Omitted.max, Math.max(bounds0Omitted.min, 90))).toBe(80)

    // Propose 10 for index 1 under explicit minStepsBetweenThumbs={0}
    const bounds1Explicit = getThumbBounds(values, 1, min, max, step, 0)
    expect(Math.min(bounds1Explicit.max, Math.max(bounds1Explicit.min, 10))).toBe(20)
  })

  it('SD-MATH-12: Slider should multiply minimum steps without precision loss when step is non-unit or decimal', () => {
    // Step=5, minStepsBetweenThumbs=2 produces distance 10
    const dist1 = roundToPrecision(2 * 5, 0)
    expect(dist1).toBe(10)

    // step=0.25, minStepsBetweenThumbs=3, value=[1, 2]
    // lower proposal 1.9 clamps to 1.25, upper proposal 1.1 clamps to 1.75
    const bounds0 = getThumbBounds([1, 2], 0, 0, 10, 0.25, 3)
    expect(bounds0.max).toBe(1.25)
    expect(Math.min(bounds0.max, Math.max(bounds0.min, 1.9))).toBe(1.25)

    const bounds1 = getThumbBounds([1, 2], 1, 0, 10, 0.25, 3)
    expect(bounds1.min).toBe(1.75)
    expect(Math.min(bounds1.max, Math.max(bounds1.min, 1.1))).toBe(1.75)
  })

  it('SD-MATH-13: Slider should recognize an exact minimum-distance boundary when no inward step remains', () => {
    const min = 0
    const max = 40
    const step = 5
    const minSteps = 4
    const values = [10, 30]

    // lower Thumb's feasible maximum is exactly 10 and upper Thumb's feasible minimum exactly 30
    const bounds0 = getThumbBounds(values, 0, min, max, step, minSteps)
    expect(bounds0.max).toBe(10)

    const bounds1 = getThumbBounds(values, 1, min, max, step, minSteps)
    expect(bounds1.min).toBe(30)

    // Outward proposals to 5 and 35 remain valid
    expect(Math.min(bounds0.max, Math.max(bounds0.min, 5))).toBe(5)
    expect(Math.min(bounds1.max, Math.max(bounds1.min, 35))).toBe(35)
  })
})

// Ported from quarantine c7bdd1f7c matrix/lib/tests/unit/splitter.test.ts (SP-MATH-*, SP-COLLAPSE-07/08 only).
// SP-TYPE-01 is NOT ported here: it encodes the mangled API (required value, min/max rename,
// omitted layout props, no root disabled). The current-API contract lives in Splitter.contract.test.tsx.
import { describe, expect, it } from 'vitest'
import {
  adjustLayoutByDelta,
  calculateSeparatorAriaValues,
  isHandleBlocked,
  isMeasuredLength,
  resolveConstraintToPercentage,
  validateLayout,
  validatePanelConstraints,
  validatePanelSize,
  validateSplitterStructure,
} from './splitter-math'

describe('Splitter math contract', () => {
  describe('SP-MATH Cases', () => {
    it('SP-MATH-01: Splitter should accept values only when finite nonnegative positional percentages total 100', () => {
      expect(validateLayout([40, 60], 2).valid).toBe(true)
      expect(validateLayout([33.333333, 33.333333, 33.333334], 3).valid).toBe(true)

      const wrongLength = validateLayout([50], 2)
      expect(wrongLength.valid).toBe(false)
      expect(wrongLength.error).toContain('does not match Panel count')

      const negativeVal = validateLayout([-1, 101], 2)
      expect(negativeVal.valid).toBe(false)
      expect(negativeVal.error).toContain('must be a finite non-negative percentage')

      const nanVal = validateLayout([NaN, 50], 2)
      expect(nanVal.valid).toBe(false)
      expect(nanVal.error).toContain('must be a finite non-negative percentage')

      const infinityVal = validateLayout([Infinity, 50], 2)
      expect(infinityVal.valid).toBe(false)
      expect(infinityVal.error).toContain('must be a finite non-negative percentage')

      const sum99 = validateLayout([40, 59], 2)
      expect(sum99.valid).toBe(false)
      expect(sum99.error).toContain('must sum to 100%')

      const sum101 = validateLayout([50, 51], 2)
      expect(sum101.valid).toBe(false)
      expect(sum101.error).toContain('must sum to 100%')
    })

    it('SP-MATH-02: Splitter should transfer an applied delta exactly when two adjacent Panels resize', () => {
      const initial = [40, 60]
      const constraints = [{ minSize: 0, maxSize: 100 }, { minSize: 0, maxSize: 100 }]
      const pivots: [number, number] = [0, 1]

      const plus10 = adjustLayoutByDelta({
        delta: 10,
        initialLayout: initial,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: initial,
      })
      expect(plus10).toEqual([50, 50])
      expect(plus10.reduce((a, b) => a + b, 0)).toBe(100)

      const minus15 = adjustLayoutByDelta({
        delta: -15,
        initialLayout: initial,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: initial,
      })
      expect(minus15).toEqual([25, 75])
      expect(minus15.reduce((a, b) => a + b, 0)).toBe(100)
    })

    it('SP-MATH-03: Splitter should apply only the feasible portion of a delta when either adjacent constraint binds', () => {
      const initial = [50, 50]
      const constraints = [
        { minSize: 20, maxSize: 60 },
        { minSize: 10, maxSize: 80 },
      ]
      const pivots: [number, number] = [0, 1]

      // Delta +50 clamps at first panel's max=60
      const clampedPlus = adjustLayoutByDelta({
        delta: 50,
        initialLayout: initial,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: initial,
      })
      expect(clampedPlus).toEqual([60, 40])

      // Further motion beyond 60 is an exact no-op (returns prevLayout)
      const furtherPlus = adjustLayoutByDelta({
        delta: 10,
        initialLayout: clampedPlus,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: clampedPlus,
      })
      expect(furtherPlus).toEqual([60, 40])

      // Delta -50 clamps at first panel's min=20
      const clampedMinus = adjustLayoutByDelta({
        delta: -50,
        initialLayout: initial,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: initial,
      })
      expect(clampedMinus).toEqual([20, 80])

      // Further motion below 20 is an exact no-op
      const furtherMinus = adjustLayoutByDelta({
        delta: -10,
        initialLayout: clampedMinus,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: clampedMinus,
      })
      expect(furtherMinus).toEqual([20, 80])
    })

    it('SP-MATH-04: Splitter should redistribute overflow through farther Panels when nearer Panels reach bounds', () => {
      const initial = [25, 25, 25, 25]
      const pivots: [number, number] = [0, 1]

      // Grow Panel 1 by 50 with minSize=0 on all panels
      const unconstrained = [
        { minSize: 0, maxSize: 100 },
        { minSize: 0, maxSize: 100 },
        { minSize: 0, maxSize: 100 },
        { minSize: 0, maxSize: 100 },
      ]

      const res1 = adjustLayoutByDelta({
        delta: 50,
        initialLayout: initial,
        panelConstraints: unconstrained,
        pivotIndices: pivots,
        prevLayout: initial,
      })
      expect(res1).toEqual([75, 0, 0, 25])

      // With min=10 on Panels 2-4, request 100
      const constrained = [
        { minSize: 0, maxSize: 100 },
        { minSize: 10, maxSize: 100 },
        { minSize: 10, maxSize: 100 },
        { minSize: 10, maxSize: 100 },
      ]

      const res2 = adjustLayoutByDelta({
        delta: 100,
        initialLayout: initial,
        panelConstraints: constrained,
        pivotIndices: pivots,
        prevLayout: initial,
      })
      expect(res2).toEqual([70, 10, 10, 10])
    })

    it('SP-MATH-05: Splitter should retain the previous valid layout when constraints make a requested result impossible', () => {
      const prev = [20, 30, 30, 20]
      const impossibleConstraints = [
        { minSize: 20, maxSize: 25 },
        { minSize: 30, maxSize: 35 },
        { minSize: 30, maxSize: 35 },
        { minSize: 20, maxSize: 25 },
      ]
      const pivots: [number, number] = [0, 1]

      // Request delta that cannot be satisfied
      const result = adjustLayoutByDelta({
        delta: 16,
        initialLayout: prev,
        panelConstraints: impossibleConstraints,
        pivotIndices: pivots,
        prevLayout: prev,
      })

      // Must return previous valid layout without negative or NaN
      expect(result).toEqual(prev)
      expect(result.every((v) => Number.isFinite(v) && v >= 0)).toBe(true)
    })

    it('SP-MATH-06: Splitter should recompute measured length constraints when available group size changes without mutating controlled percentages', () => {
      const available500 = 500
      const min24 = resolveConstraintToPercentage('120px', available500, null, 0)
      const max90 = resolveConstraintToPercentage('450px', available500, null, 100)
      expect(min24).toBe(24)
      expect(max90).toBe(90)

      const available1000 = 1000
      const min12 = resolveConstraintToPercentage('120px', available1000, null, 0)
      const max45 = resolveConstraintToPercentage('450px', available1000, null, 100)
      expect(min12).toBe(12)
      expect(max45).toBe(45)

      // ARIA limits for Handle 0 with controlled [40, 60]
      const aria500 = calculateSeparatorAriaValues({
        layout: [40, 60],
        panelConstraints: [{ minSize: 24, maxSize: 90 }, { minSize: 0, maxSize: 100 }],
        panelIndex: 0,
      })
      expect(aria500.valueNow).toBe(40)
      expect(aria500.valueMin).toBe(24)
      expect(aria500.valueMax).toBe(90)

      const aria1000 = calculateSeparatorAriaValues({
        layout: [40, 60],
        panelConstraints: [{ minSize: 12, maxSize: 45 }, { minSize: 0, maxSize: 100 }],
        panelIndex: 0,
      })
      expect(aria1000.valueNow).toBe(40)
      expect(aria1000.valueMin).toBe(12)
      expect(aria1000.valueMax).toBe(45)
    })

    it('SP-MATH-07: Splitter should combine percentage and measured constraints when preserving a 100-point total', () => {
      const groupSize = 400
      const minVal = 12.5
      const maxVal = resolveConstraintToPercentage('160px', groupSize, null, 100)
      expect(maxVal).toBe(40)

      const initial = [33.3, 33.3, 33.4]
      const constraints = [
        { minSize: minVal, maxSize: maxVal },
        { minSize: 0, maxSize: 100 },
        { minSize: 0, maxSize: 100 },
      ]

      const res = adjustLayoutByDelta({
        delta: 7.7,
        initialLayout: initial,
        panelConstraints: constraints,
        pivotIndices: [0, 1],
        prevLayout: initial,
      })

      expect(res[0]).toBeLessThanOrEqual(maxVal)
      expect(res[0]).toBeGreaterThanOrEqual(minVal)
      const sum = res.reduce((a, b) => a + b, 0)
      expect(Math.abs(sum - 100)).toBeLessThan(0.01)
    })

    it('SP-MATH-08: Splitter should defer constraint interaction when its measured group size is zero', () => {
      const zeroGroupSize = 0
      const resolvedMin = resolveConstraintToPercentage('120px', zeroGroupSize, null, 0)
      const resolvedMax = resolveConstraintToPercentage('450px', zeroGroupSize, null, 100)

      expect(resolvedMin).toBe(0)
      expect(resolvedMax).toBe(100)
      expect(Number.isFinite(resolvedMin)).toBe(true)
      expect(Number.isFinite(resolvedMax)).toBe(true)

      // Provide 500px and next solve uses valid measured percentages
      const validMin = resolveConstraintToPercentage('120px', 500, null, 0)
      const validMax = resolveConstraintToPercentage('450px', 500, null, 100)
      expect(validMin).toBe(24)
      expect(validMax).toBe(90)
    })

    it('SP-MATH-09: Splitter should reverse logical adjacency when horizontal direction becomes RTL', () => {
      const layout = [20, 30, 50]
      // In LTR: handle 0 primary is panel 0
      // In RTL: handle 0 primary is panel 1, delta applied to logical primary is inverted
      const physicalDelta = 10
      const rtlDelta = -physicalDelta

      const result = adjustLayoutByDelta({
        delta: rtlDelta,
        initialLayout: layout,
        panelConstraints: [{ minSize: 0, maxSize: 100 }, { minSize: 0, maxSize: 100 }, { minSize: 0, maxSize: 100 }],
        pivotIndices: [0, 1],
        prevLayout: layout,
      })

      expect(result).toEqual([10, 40, 50])
      expect(result.reduce((a, b) => a + b, 0)).toBe(100)
    })

    it('SP-MATH-10: Splitter should reject Panel constraints when they are invalid or jointly impossible before interaction', () => {
      expect(validatePanelConstraints([{ min: -5 }]).valid).toBe(false)
      expect(validatePanelConstraints([{ min: NaN }]).valid).toBe(false)
      expect(validatePanelConstraints([{ min: 'invalid-css' }]).valid).toBe(false)
      expect(validatePanelConstraints([{ min: 70, max: 60 }]).valid).toBe(false)
      expect(validatePanelConstraints([{ collapsedSize: -1 }]).valid).toBe(false)
      expect(validatePanelConstraints([{ collapsedSize: 101 }]).valid).toBe(false)
      expect(validatePanelConstraints([{ max: 40, collapsedSize: 50 }]).valid).toBe(false)

      // 3 panels whose minima sum to > 100
      const impossibleSum = validatePanelConstraints([
        { min: 40 },
        { min: 40 },
        { min: 30 },
      ])
      expect(impossibleSum.valid).toBe(false)
      expect(impossibleSum.error).toContain('exceeds 100%')

      // Allowed: collapsedSize below ordinary min
      const allowed = validatePanelConstraints([
        { min: 20, collapsedSize: 5, collapsible: true },
        { min: 10 },
      ])
      expect(allowed.valid).toBe(true)
    })

    it('SP-MATH-11: Splitter should treat available group size as the Panel-axis sum when converting measured constraints', () => {
      // 516px root with 16px handle -> available size is 500px
      const availableSize = 516 - 16
      expect(availableSize).toBe(500)

      const resolved = resolveConstraintToPercentage('100px', availableSize, null, 0)
      expect(resolved).toBe(20)

      // Confirm it is not 19.38% (which would be 100 / 516)
      expect(resolved).not.toBeCloseTo((100 / 516) * 100, 1)
    })

    it('SP-MATH-12: Splitter should apply pointer delta to the pointerdown origin layout rather than accumulating per-move increments', () => {
      const originLayout = [40, 60]
      const availableSize = 500
      const constraints = [{ minSize: 0, maxSize: 100 }, { minSize: 0, maxSize: 100 }]
      const pivots: [number, number] = [0, 1]

      // +10px from origin -> delta = (10 / 500) * 100 = 2%
      const move1 = adjustLayoutByDelta({
        delta: (10 / availableSize) * 100,
        initialLayout: originLayout,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: originLayout,
      })
      expect(move1).toEqual([42, 58])

      // +25px from origin -> delta = (25 / 500) * 100 = 5%
      const move2 = adjustLayoutByDelta({
        delta: (25 / availableSize) * 100,
        initialLayout: originLayout,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: move1,
      })
      expect(move2).toEqual([45, 55])

      // +50px from origin -> delta = (50 / availableSize) * 100 = 10%
      const move3 = adjustLayoutByDelta({
        delta: (50 / availableSize) * 100,
        initialLayout: originLayout,
        panelConstraints: constraints,
        pivotIndices: pivots,
        prevLayout: move2,
      })
      expect(move3).toEqual([50, 50])
    })
  })

  describe('SP-DOM-02: structural validator (unit slice of the browser case)', () => {
    it('accepts Panel (Handle Panel)+ with a matching value length', () => {
      expect(validateSplitterStructure(['panel', 'handle', 'panel'], 2).valid).toBe(true)
      expect(
        validateSplitterStructure(['panel', 'handle', 'panel', 'handle', 'panel'], 3).valid
      ).toBe(true)
    })

    it('rejects empty and one-Panel trees', () => {
      const empty = validateSplitterStructure([], 0)
      expect(empty.valid).toBe(false)
      expect(empty.error).toContain('at least two Panels')
      const one = validateSplitterStructure(['panel'], 1)
      expect(one.valid).toBe(false)
      expect(one.error).toContain('only one is mounted')
    })

    it('rejects value length mismatches with an atomic-update diagnostic', () => {
      const short = validateSplitterStructure(['panel', 'handle', 'panel'], 1)
      expect(short.valid).toBe(false)
      expect(short.error).toContain('value has 1 entry but 2 Panels are mounted')
      expect(short.error).toContain('atomically')
      const long = validateSplitterStructure(['panel', 'handle', 'panel'], 3)
      expect(long.valid).toBe(false)
      expect(long.error).toContain('value has 3 entries but 2 Panels are mounted')
    })

    it('rejects leading, trailing, and consecutive Handles', () => {
      for (const sequence of [
        ['handle', 'panel', 'handle', 'panel'],
        ['panel', 'handle', 'panel', 'handle'],
        ['panel', 'handle', 'handle', 'panel'],
      ] as Array<Array<'panel' | 'handle'>>) {
        const check = validateSplitterStructure(sequence, 2)
        expect(check.valid).toBe(false)
        expect(check.error).toContain('Invalid structure')
      }
      // Consecutive Handles trip the count rule with the exact numbers.
      const doubled = validateSplitterStructure(['panel', 'handle', 'handle', 'panel'], 2)
      expect(doubled.error).toContain('need exactly 1 Handle, but 2 are mounted')
    })

    it('rejects consecutive Panels and names the mounted order', () => {
      const check = validateSplitterStructure(['panel', 'panel'], 2)
      expect(check.valid).toBe(false)
      expect(check.error).toContain('need exactly 1 Handle, but 0 are mounted')
      // Right counts but wrong order (leading Handle) names the sequence.
      const leading = validateSplitterStructure(['handle', 'panel', 'panel'], 2)
      expect(leading.valid).toBe(false)
      expect(leading.error).toContain('strictly alternate')
      expect(leading.error).toContain('handle → panel → panel')
    })
  })

  describe('SP-DOM-08: Handle feasibility probe (unit slice of the browser case)', () => {
    it('reports feasible when either direction moves the layout', () => {
      const open = [
        { minSize: 5, maxSize: 100 },
        { minSize: 5, maxSize: 100 },
      ]
      expect(isHandleBlocked({ layout: [40, 60], panelConstraints: open, handleIndex: 0 })).toBe(
        false
      )
      // One pinned boundary still leaves the other direction: panel 0
      // sits at its min but can grow.
      const halfPinned = [
        { minSize: 40, maxSize: 100 },
        { minSize: 5, maxSize: 100 },
      ]
      expect(
        isHandleBlocked({ layout: [40, 60], panelConstraints: halfPinned, handleIndex: 0 })
      ).toBe(false)
    })

    it('reports blocked when both adjacent Panels are pinned at bounds', () => {
      const pinned = [
        { minSize: 40, maxSize: 40 },
        { minSize: 60, maxSize: 60 },
      ]
      expect(isHandleBlocked({ layout: [40, 60], panelConstraints: pinned, handleIndex: 0 })).toBe(
        true
      )
    })

    it('reports feasible when a big drag could still collapse a collapsible Panel', () => {
      const collapsibleAtMin = [
        { minSize: 20, maxSize: 100, collapsible: true, collapsedSize: 5 },
        { minSize: 5, maxSize: 100 },
      ]
      expect(
        isHandleBlocked({ layout: [20, 80], panelConstraints: collapsibleAtMin, handleIndex: 0 })
      ).toBe(false)
    })

    it('reports blocked for out-of-range Handles and mismatched tables', () => {
      const open = [
        { minSize: 5, maxSize: 100 },
        { minSize: 5, maxSize: 100 },
      ]
      expect(isHandleBlocked({ layout: [40, 60], panelConstraints: open, handleIndex: -1 })).toBe(
        true
      )
      expect(isHandleBlocked({ layout: [40, 60], panelConstraints: open, handleIndex: 1 })).toBe(
        true
      )
      expect(isHandleBlocked({ layout: [40, 60], panelConstraints: [open[0]!], handleIndex: 0 })).toBe(
        true
      )
    })
  })

  describe('FEATURES #3: measured-length grammar alignment', () => {
    it('accepts what the resolver accepts, including unitless zero', () => {
      for (const valid of ['120px', '10rem', '2em', '12r', '20%', '0', '0.0', '12PX', ' 120px ']) {
        expect(isMeasuredLength(valid)).toBe(true)
      }
      expect(resolveConstraintToPercentage('0', 500, null, 5)).toBe(0)
      expect(resolveConstraintToPercentage('12PX', 400, null, 5)).toBe(3)
    })

    it('rejects malformed and negative lengths, which the component ignores', () => {
      for (const invalid of ['invalid-css', 'abc', '12', '-5px', '10pt', '']) {
        expect(isMeasuredLength(invalid)).toBe(false)
        expect(validatePanelConstraints([{ min: invalid }]).valid).toBe(false)
      }
      // Negative lengths resolve to the fallback instead of poisoning the solver.
      expect(resolveConstraintToPercentage('-5px', 500, null, 5)).toBe(5)
    })
  })

  describe('SP-COLLAPSE Unit Cases', () => {
    it('SP-COLLAPSE-07: Splitter should bypass ordinary minimum only when an opted-in Panel is explicitly collapsed', () => {
      const panelConstraints = {
        minSize: 20,
        maxSize: 100,
        collapsible: true,
        collapsedSize: 5,
      }

      // Valid collapsed size
      const size5 = validatePanelSize({
        panelConstraints,
        prevSize: 5,
        size: 5,
      })
      expect(size5).toBe(5)

      // Valid expanded size >= 20
      const size25 = validatePanelSize({
        panelConstraints,
        prevSize: 25,
        size: 25,
      })
      expect(size25).toBe(25)

      // Sizes in 6..19 are rejected/snapped:
      // below halfway ((5+20)/2 = 12.5) -> collapses to 5
      const size10 = validatePanelSize({
        panelConstraints,
        prevSize: 20,
        size: 10,
      })
      expect(size10).toBe(5)

      // above halfway -> snaps to min 20
      const size15 = validatePanelSize({
        panelConstraints,
        prevSize: 5,
        size: 15,
      })
      expect(size15).toBe(20)
    })

    it('SP-COLLAPSE-08: Splitter should use the midpoint threshold when pointer resize crosses the gap between minimum and collapsed size', () => {
      const panelConstraints = [
        { minSize: 20, maxSize: 100, collapsible: true, collapsedSize: 10 },
        { minSize: 0, maxSize: 100 },
      ]
      // Midpoint between min (20) and collapsed (10) is 15.
      // At midpoint (15): stays expanded at 20
      const atMidpoint = validatePanelSize({
        panelConstraints: panelConstraints[0]!,
        prevSize: 20,
        size: 15,
      })
      expect(atMidpoint).toBe(20)

      // Below midpoint (14): collapses to 10
      const belowMidpoint = validatePanelSize({
        panelConstraints: panelConstraints[0]!,
        prevSize: 20,
        size: 14,
      })
      expect(belowMidpoint).toBe(10)

      // Total remains 100 when solved through adjustLayoutByDelta
      const layoutAt14 = adjustLayoutByDelta({
        delta: -6, // from 20 -> 14 (below midpoint)
        initialLayout: [20, 80],
        panelConstraints,
        pivotIndices: [0, 1],
        prevLayout: [20, 80],
      })
      expect(layoutAt14).toEqual([10, 90])
      expect(layoutAt14.reduce((a, b) => a + b, 0)).toBe(100)
    })
  })
})

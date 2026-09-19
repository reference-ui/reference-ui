/**
 * Partial-guard station (Tabs indicator). A binding whose branching init
 * drops a dynamic arm beside kept leaves keeps its values but never folds
 * a test: every guard below stays open with both arms emitting one want
 * and one runtime plan, and the value union still scoops its kept leaf.
 */
import { expect } from 'vitest'
import { getWantsForProp, hasWant, type AtomicCaseSpec } from '../../helpers.js'

const spec: AtomicCaseSpec = {
  id: 'ATM-SITE-86',
  verify(result) {
    // The Tabs indicator: both border arms emit wants and plans.
    expect(hasWant(result, 'borderBottom', '3px solid')).toBe(true)
    expect(hasWant(result, 'borderBottom', '3px solid transparent')).toBe(true)
    // The coalesce guard: both cursor and opacity arms emit.
    expect(hasWant(result, 'cursor', 'not-allowed')).toBe(true)
    expect(hasWant(result, 'cursor', 'pointer')).toBe(true)
    expect(hasWant(result, 'opacity', 0.5)).toBe(true)
    expect(hasWant(result, 'opacity', 1)).toBe(true)
    // Every css()-gated twin lowers both color blocks (eight guards).
    expect(getWantsForProp(result, 'color')).toHaveLength(18)

    // One runtime plan per unique leaf: two borders, two cursors, two
    // opacities, and the three shared color blocks.
    const plans = result.runtime.stylePlans
    expect(plans).toHaveLength(9)
    for (const [prop, value] of [
      ['borderBottom', '3px solid'],
      ['borderBottom', '3px solid transparent'],
      ['cursor', 'not-allowed'],
      ['cursor', 'pointer'],
      ['color', 'red.500'],
      ['color', 'blue.500'],
      ['color', 'green.500'],
    ] as const) {
      expect(plans.some(p => p.prop === prop && p.value === value)).toBe(true)
    }

    const sheet = result.stylesheet
    expect(sheet).toContain('border-bottom-width: 3px')
    expect(sheet).toContain('border-bottom-style: solid')
    expect(sheet).toContain('border-bottom-color: transparent')
    expect(sheet).toContain('cursor: not-allowed')
    expect(sheet).toContain('cursor: pointer')
    expect(sheet).toContain('opacity: 0.5')

    // Open tests name no dead arm and walked positions are all static.
    expect(result.diagnostics).toEqual([])
  },
}

export default spec

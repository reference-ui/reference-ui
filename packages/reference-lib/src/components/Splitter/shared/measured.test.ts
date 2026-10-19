/**
 * Proof for the solver constraint table. Pins live numbers kept with
 * defaults for the unresolved, invalid sanitized to default bounds,
 * string-bound resolution through the measured table, and table equality.
 */
import { describe, expect, it } from 'vitest'
import type { RegisteredPanel } from '../context'
import { measuredEntriesEqual, toSolverConstraints } from './measured'

function panel(overrides: Partial<RegisteredPanel> = {}): RegisteredPanel {
  return {
    key: 'a',
    id: 'panel-a',
    element: null,
    min: undefined,
    max: undefined,
    collapsible: false,
    collapsedSize: 0,
    ...overrides,
  }
}

describe('solver constraint table', () => {
  it('keeps live numbers and falls back to defaults for the unresolved', () => {
    const constraints = toSolverConstraints(
      [panel({ key: 'a', min: 10, collapsible: true, collapsedSize: 2 })],
      new Map()
    )
    expect(constraints).toEqual([{ minSize: 10, maxSize: 100, collapsible: true, collapsedSize: 2 }])
  })

  it('sanitizes invalid numbers to the default bound', () => {
    const constraints = toSolverConstraints(
      [panel({ key: 'a', min: NaN, max: -3, collapsedSize: NaN })],
      new Map()
    )
    expect(constraints).toEqual([{ minSize: 5, maxSize: 100, collapsible: false, collapsedSize: 0 }])
  })

  it('resolves string bounds through the measured table', () => {
    const constraints = toSolverConstraints(
      [panel({ key: 'a', min: '10px', max: '50px' })],
      new Map([['a', { min: 12, max: 48 }]])
    )
    expect(constraints).toEqual([{ minSize: 12, maxSize: 48, collapsible: false, collapsedSize: 0 }])
  })

  it('compares measured tables by key and entry', () => {
    const a = new Map([['a', { min: 1, max: 2 }]])
    expect(measuredEntriesEqual(a, new Map([['a', { min: 1, max: 2 }]]))).toBe(true)
    expect(measuredEntriesEqual(a, new Map([['a', { min: 1, max: 3 }]]))).toBe(false)
    expect(measuredEntriesEqual(a, new Map())).toBe(false)
    expect(
      measuredEntriesEqual(a, new Map([['a', { min: 1, max: 2 }], ['b', { min: null, max: null }]]))
    ).toBe(false)
  })
})

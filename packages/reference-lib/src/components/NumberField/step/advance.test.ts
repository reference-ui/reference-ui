/**
 * Proof for the pure step advance behind increment and decrement. Pins
 * directional lattice stepping, null stepping to the in-range value
 * nearest zero, and exact-endpoint clamps with noops at the value.
 */
import { describe, expect, it } from 'vitest'
import { nextStepValue, type AdvanceInput } from './advance'

function input(overrides: Partial<AdvanceInput> = {}): AdvanceInput {
  return {
    base: 0,
    value: 0,
    direction: 1,
    factor: 1,
    min: -Infinity,
    max: Infinity,
    step: 1,
    ...overrides,
  }
}

describe('step advance', () => {
  it('steps directionally on the lattice', () => {
    expect(nextStepValue(input({ base: 2, value: 2, direction: 1 }))).toEqual({
      kind: 'request',
      candidate: 3,
    })
    expect(nextStepValue(input({ base: 2, value: 2, direction: -1 }))).toEqual({
      kind: 'request',
      candidate: 1,
    })
  })

  it('selects the in-range value nearest zero from null, ignoring the factor', () => {
    expect(nextStepValue(input({ base: null, value: null, factor: 10 }))).toEqual({
      kind: 'request',
      candidate: 0,
    })
    expect(
      nextStepValue(input({ base: null, value: null, min: 5, max: 10, direction: -1 }))
    ).toEqual({ kind: 'request', candidate: 5 })
  })

  it('clamps to the exact endpoint and noops at the value', () => {
    expect(nextStepValue(input({ base: 9, value: 9, max: 10, direction: 1 })) ).toEqual({
      kind: 'request',
      candidate: 10,
    })
    expect(nextStepValue(input({ base: 10, value: 10, max: 10, direction: 1 }))).toEqual({
      kind: 'noop',
    })
  })
})

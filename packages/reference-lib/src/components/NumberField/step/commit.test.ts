/**
 * Proof for the pure commit decision behind every commit boundary. Pins
 * null clearing, invalid-text failure, clamp-without-snap, lattice
 * endpoint-first snapping, and validate-mode raw retention with reasons.
 */
import { describe, expect, it } from 'vitest'
import { draftNumberSymbols } from '../draft/symbols'
import { decideCommit, type CommitInput } from './commit'

const symbols = draftNumberSymbols('en-US')

function input(overrides: Partial<CommitInput> = {}): CommitInput {
  return {
    text: '',
    value: null,
    min: -Infinity,
    max: Infinity,
    latticeMin: undefined,
    latticeMax: undefined,
    step: 1,
    symbols,
    percentStyle: false,
    commitBehavior: 'none',
    roundTrip: (candidate: number) => candidate,
    ...overrides,
  }
}

describe('commit decision', () => {
  it('clears to null, and clearing an empty field is a noop', () => {
    expect(decideCommit(input({ text: '   ', value: 5 }))).toEqual({
      kind: 'request',
      candidate: null,
    })
    expect(decideCommit(input({ text: '   ', value: null }))).toEqual({ kind: 'noop' })
  })

  it('fails invalid text and noops the current value (FEATURES #2)', () => {
    expect(decideCommit(input({ text: 'abc', value: 5 })).kind).toBe('failed')
    expect(decideCommit(input({ text: '5', value: 5 }))).toEqual({ kind: 'noop' })
  })

  it('clamps without snapping under the none policy', () => {
    expect(decideCommit(input({ text: '150', value: 0, max: 100 }))).toEqual({
      kind: 'request',
      candidate: 100,
    })
    expect(decideCommit(input({ text: '7', value: 0, step: 5 }))).toEqual({
      kind: 'request',
      candidate: 7,
    })
  })

  it('snaps through the lattice endpoint-first under snap', () => {
    expect(
      decideCommit(input({ text: '7', value: 0, step: 5, commitBehavior: 'snap' }))
    ).toEqual({ kind: 'request', candidate: 5 })
    expect(
      decideCommit(
        input({ text: '10', value: 0, min: 0, max: 10, latticeMin: 0, latticeMax: 10, step: 3, commitBehavior: 'snap' })
      )
    ).toEqual({ kind: 'request', candidate: 10 })
  })

  it('retains the raw candidate with an advisory reason under validate', () => {
    expect(
      decideCommit(input({ text: '150', value: 0, max: 100, commitBehavior: 'validate' }))
    ).toEqual({ kind: 'request', candidate: 150, invalidReason: 'out-of-range' })
    expect(
      decideCommit(input({ text: '7', value: 0, step: 5, commitBehavior: 'validate' }))
    ).toEqual({ kind: 'request', candidate: 7, invalidReason: 'off-step' })
    expect(
      decideCommit(input({ text: '10', value: 0, step: 5, commitBehavior: 'validate' }))
    ).toEqual({ kind: 'request', candidate: 10 })
  })

  it('discards a single leading orphan group separator at commit', () => {
    expect(decideCommit(input({ text: ',024', value: 0 }))).toEqual({
      kind: 'request',
      candidate: 24,
    })
  })
})

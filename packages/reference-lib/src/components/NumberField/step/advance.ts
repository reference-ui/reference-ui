/**
 * The pure step advance: what increment and decrement request. The first
 * step from null selects the in-range value nearest zero with no
 * additional step (the factor is ignored); every other step moves
 * directionally on the lattice, clamped to the exact endpoint. Returns a
 * candidate or a noop when the advance would not move the value — the
 * step actions apply session-end and request semantics around it. Pure,
 * proven by its colocated suite.
 */
import { cleanFloat, stepLatticeInDirection } from './lattice'

export interface AdvanceInput {
  base: number | null
  value: number | null
  direction: 1 | -1
  factor: number
  min: number
  max: number
  step: number
}

export type AdvanceDecision = { kind: 'request'; candidate: number } | { kind: 'noop' }

export function nextStepValue(input: AdvanceInput): AdvanceDecision {
  const { base, value, direction, factor, min, max, step } = input
  // First step from null selects the in-range value nearest zero
  // (NF-MATH-05) — no additional step, so the factor is ignored.
  if (base === null) {
    return { kind: 'request', candidate: Math.min(max, Math.max(min, 0)) }
  }
  // Directional lattice step, clamped to the exact endpoint
  // (NF-MATH-04/06): off-grid bases move strictly in-direction.
  const nextVal =
    direction > 0
      ? cleanFloat(Math.min(max, stepLatticeInDirection(base, 1, step, factor)))
      : cleanFloat(Math.max(min, stepLatticeInDirection(base, -1, step, factor)))
  if (nextVal === value) return { kind: 'noop' }
  return { kind: 'request', candidate: nextVal }
}

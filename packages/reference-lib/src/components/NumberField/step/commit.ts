/**
 * The pure commit decision: what a dirty draft means at a commit boundary.
 * decideCommit parses the text and applies the commit policy — validate
 * retains the rounded raw candidate with an advisory reason, snap walks
 * endpoint-preservation → lattice → authored rounding → final clamp,
 * 'none' clamps — and reports request/failed/noop without touching state;
 * a validate noop on an echoed invalid value still carries its reason.
 * The commit hook applies the decision: requests, failure flags, and the
 * advisory invalid-commit report. Pure, proven by its colocated suite.
 */
import { parseDraftNumber } from '../draft/parse'
import type { DraftNumberSymbols } from '../draft/symbols'
import type { NumberFieldCommitBehavior, NumberFieldInvalidCommitReason } from '../types'
import { isOnStepLattice, snapValueToLattice } from './lattice'

export interface CommitInput {
  text: string
  value: number | null
  min: number
  max: number
  latticeMin: number | undefined
  latticeMax: number | undefined
  step: number
  symbols: DraftNumberSymbols
  percentStyle: boolean
  commitBehavior: NumberFieldCommitBehavior
  roundTrip: (candidate: number) => number
}

export type CommitDecision =
  | { kind: 'request'; candidate: number | null; invalidReason?: NumberFieldInvalidCommitReason }
  | { kind: 'failed' }
  | { kind: 'noop'; attempted?: number; invalidReason?: NumberFieldInvalidCommitReason }

// Commit outcome for submit handling: 'request' means the parent has
// not echoed yet (submit must wait for an explicit retry), 'failed'
// records a boundary that blocks every later submit, 'noop' leaves the
// already-canonical hidden state submittable.
export function decideCommit(input: CommitInput): CommitDecision {
  const {
    text,
    value,
    min,
    max,
    latticeMin,
    latticeMax,
    step,
    symbols,
    percentStyle,
    commitBehavior,
    roundTrip,
  } = input
  if (text.trim() === '') {
    // FEATURES #2: clearing an already-empty field is no change.
    if (value === null) return { kind: 'noop' }
    return { kind: 'request', candidate: null }
  }
  const parsed = parseDraftNumber(text, symbols, percentStyle, { allowOrphanHead: true })
  // Invalid/incomplete text reverts without a numeric substitute and
  // records a failed boundary (NF-COMMIT-03/07).
  if (Number.isNaN(parsed)) {
    return { kind: 'failed' }
  }
  // Validate retains and reports — request the
  // rounded raw candidate as-is (never snap, never clamp); managed
  // invalid state derives from the controlled value and blocks submit.
  // onInvalidCommit is advisory: it fires after the onChange request
  // (or, when the live request was already echoed, on the noop alone)
  // whenever the committed candidate violates constraints, range-first.
  // Violation is judged on the committed (rounded) candidate, so a
  // rounding that lands valid stays silent.
  if (commitBehavior === 'validate') {
    const accepted = roundTrip(parsed)
    const canonical = Object.is(accepted, -0) ? 0 : accepted
    let invalidReason: NumberFieldInvalidCommitReason | undefined
    if (canonical < min || canonical > max) {
      invalidReason = 'out-of-range'
    } else if (!isOnStepLattice(canonical, step)) {
      invalidReason = 'off-step'
    }
    // FEATURES #2: committing the current value is no change — but a
    // parent that echoed the live request still hears the advisory
    // (issue #25), so the noop carries the attempted value and reason.
    if (canonical === value) {
      return invalidReason === undefined
        ? { kind: 'noop' }
        : { kind: 'noop', attempted: canonical, invalidReason }
    }
    return invalidReason === undefined
      ? { kind: 'request', candidate: canonical }
      : { kind: 'request', candidate: canonical, invalidReason }
  }
  // Snap order (NF-MATH-12): endpoint-preservation
  // or nearest lattice, then authored rounding, then final clamp — one
  // request, never an invalid-commit report.
  if (commitBehavior === 'snap') {
    const snapped = snapValueToLattice(parsed, latticeMin, latticeMax, step)
    const accepted = roundTrip(snapped)
    const clamped = Math.max(min, Math.min(max, accepted))
    const canonical = Object.is(clamped, -0) ? 0 : clamped
    // FEATURES #2: committing the current value is no change.
    if (canonical === value) return { kind: 'noop' }
    return { kind: 'request', candidate: canonical }
  }
  const clamped = Math.max(min, Math.min(max, parsed))
  // FEATURES #2: committing the current value is no change.
  if (clamped === value) return { kind: 'noop' }
  return { kind: 'request', candidate: clamped }
}

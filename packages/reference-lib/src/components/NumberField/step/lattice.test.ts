/**
 * Proof for the zero-anchored step lattice. Pins nearest-point snapping
 * with away-from-zero ties, exact-bound endpoints, float-drift cleaning,
 * membership tests, and strictly in-direction stepping.
 */
import { describe, expect, it } from 'vitest'
import {
  cleanFloat,
  isOnStepLattice,
  snapValueToLattice,
  stepLatticeInDirection,
} from './lattice'

describe('zero-anchored step lattice', () => {
  it('snaps to the nearest lattice point with away-from-zero ties', () => {
    expect(snapValueToLattice(2.3, undefined, undefined, 1)).toBe(2)
    expect(snapValueToLattice(2.5, undefined, undefined, 1)).toBe(3)
    expect(snapValueToLattice(-2.5, undefined, undefined, 1)).toBe(-3)
  })

  it('preserves exact and exceeded bounds as endpoints', () => {
    expect(snapValueToLattice(10, 0, 10, 3)).toBe(10)
    expect(snapValueToLattice(12, 0, 10, 3)).toBe(10)
    expect(snapValueToLattice(0, 0, 10, 3)).toBe(0)
  })

  it('cleans float drift without touching genuine values', () => {
    expect(cleanFloat(0.1 + 0.2)).toBe(0.3)
    expect(cleanFloat(-0)).toBe(0)
    expect(cleanFloat(1.5)).toBe(1.5)
  })

  it('tests lattice membership without the endpoint exception', () => {
    expect(isOnStepLattice(6, 3)).toBe(true)
    expect(isOnStepLattice(7, 3)).toBe(false)
    expect(isOnStepLattice(10, 3)).toBe(false)
  })

  it('steps strictly in-direction with Shift equal to ten singles', () => {
    expect(stepLatticeInDirection(2, 1, 1, 1)).toBe(3)
    expect(stepLatticeInDirection(2, -1, 1, 1)).toBe(1)
    // Off-grid base moves strictly in-direction first.
    expect(stepLatticeInDirection(2.2, 1, 1, 1)).toBe(3)
    expect(stepLatticeInDirection(2.2, -1, 1, 1)).toBe(2)
    // Shift lands where ten single steps would.
    expect(stepLatticeInDirection(2.2, 1, 1, 10)).toBe(12)
  })
})

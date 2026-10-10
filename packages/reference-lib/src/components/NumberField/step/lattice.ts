/**
 * The zero-anchored step lattice (NF-MATH): snapping to the nearest
 * lattice point with away-from-zero midpoint ties, pure lattice
 * membership, and directional stepping where Shift+Arrow equals ten
 * single steps. Float-drift cleanup keeps every quotient exact at
 * binary-noise edges. Pure, proven by its colocated suite.
 */

// Float-drift cleanup ported verbatim from quarantine (NF-MATH-07/08/14):
// snaps ordinary decimal stepping (0.1 + 0.2) back to the representable
// value only when within float epsilon, and canonicalizes -0 to 0.
export function cleanFloat(value: number): number {
  if (!Number.isFinite(value)) return value
  const rounded = parseFloat(value.toPrecision(15))
  if (
    Math.abs(rounded - value) <=
    Math.min(Number.EPSILON * Math.max(1, Math.abs(value)), 1e-10)
  ) {
    return Object.is(rounded, -0) ? 0 : rounded
  }
  return Object.is(value, -0) ? 0 : value
}

// Step-precision rounding ported from React Spectrum's
// react-stately/src/utils/number.ts (roundToStepPrecision): keeps snap math
// on the representable lattice instead of accumulating binary noise.
export function roundToStepPrecision(value: number, step: number): number {
  let roundedValue = value
  let precision = 0
  const stepString = step.toString()
  const eIndex = stepString.toLowerCase().indexOf('e-')
  if (eIndex > 0) {
    precision = Math.abs(Math.floor(Math.log10(Math.abs(step)))) + eIndex
  } else {
    const pointIndex = stepString.indexOf('.')
    if (pointIndex >= 0) {
      precision = stepString.length - pointIndex
    }
  }
  if (precision > 0) {
    const pow = Math.pow(10, precision)
    roundedValue = Math.round(roundedValue * pow) / pow
  }
  return roundedValue
}

// NFLAST ruling (a): the TESTS.md freeze lattice, replacing the signed-off
// W-02 RAC math (min-anchored, half-up ties, lattice-clamped max) — re-pinned
// pre-release-cheap per root docs/MISSIONS/DECISIONS.md §3. Zero-anchored nearest lattice
// with away-from-zero midpoint ties; exact/exceeded non-grid bounds are
// preserved as endpoints. Order: endpoint-preservation → nearest-lattice →
// authored rounding (the caller applies displayRoundTrip) → final clamp
// (also the caller, NF-MATH-12).
export function snapValueToLattice(value: number, min: number | undefined, max: number | undefined, step: number): number {
  // Endpoint preservation (NF-MATH-10/11): an exact or exceeded bound is
  // returned as-is, never snapped to the lattice.
  if (min !== undefined && value <= min) return min
  if (max !== undefined && value >= max) return max
  // cleanFloat stabilizes float-quotient ties (0.075/0.05 reads
  // 1.4999999999999998) before the tie decision.
  const quotient = cleanFloat(value / step)
  const snappedQuotient = quotient >= 0 ? Math.floor(quotient + 0.5) : Math.ceil(quotient - 0.5)
  return roundToStepPrecision(snappedQuotient * step, step)
}

// Pure zero-lattice membership (NF-MATH-15): off-grid supplied endpoints are
// NOT on-lattice here — the snap branch of ownedInvalid grants them the
// endpoint exception, while validate reports them step-invalid.
export function isOnStepLattice(value: number, step: number): boolean {
  const snapped = snapValueToLattice(value, undefined, undefined, step)
  return roundToStepPrecision(snapped - value, step) === 0
}

// Directional lattice stepping (NF-MATH-04/06, freeze decision 6): the next
// lattice point strictly in `direction`, then (factor - 1) further lattice
// steps — Shift+Arrow ≡ 10× Arrow, so off-grid Shift lands where ten single
// steps would (least-surprise interpolation, flagged in DECISIONS.md).
// cleanFloat keeps the strictness exact at float-quotient edges (0.3/0.1).
export function stepLatticeInDirection(base: number, direction: 1 | -1, step: number, factor: number): number {
  const quotient = cleanFloat(base / step)
  const edge = direction > 0 ? Math.floor(quotient) + 1 : Math.ceil(quotient) - 1
  return roundToStepPrecision((edge + direction * (factor - 1)) * step, step)
}

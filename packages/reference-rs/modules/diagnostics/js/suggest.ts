/**
 * Did-you-mean suggestions for unknown names, gated by the diagnostic codes that may carry one.
 * Takes a diagnostic code, the unknown name, and the candidate names, and emits the closest candidate within budget or undefined.
 * Mirrors the Rust helper exactly: the code list decides whether suggesting is legitimate, and the edit distance decides whether a candidate is near enough.
 */

/**
 * Codes whose failure is an unknown name drawn from a finite known set: the only codes
 * `suggestForCode` will suggest for. Mirrors the Rust gate exactly; opaque names and every
 * other failure class stay silent even when a candidate looks near.
 */
export const SUGGESTION_CODES: readonly string[] = [
  'ATM-W-UNKNOWN-PROPERTY',
  'ATM-W-UNKNOWN-BREAKPOINT',
  'ATM-W-UNKNOWN-CONDITION',
  'ATM-W-UNKNOWN-TOKEN-PATH',
  'ATM-W-UNKNOWN-COLOR',
  'ATM-W-UNKNOWN-TONE',
  'ATM-E-UNKNOWN-TOKEN',
  'TGN-W-UNKNOWN-TOKEN-CATEGORY',
  'TGN-W-UNKNOWN-STRICT-CATEGORY',
]

/** Whether `code` may carry a did-you-mean suggestion: membership in `SUGGESTION_CODES`. */
export function supportsSuggestions(code: string): boolean {
  return SUGGESTION_CODES.includes(code)
}

/**
 * Pick the closest candidate for one diagnostic code, or undefined when the code is not a
 * suggestion code or all candidates are far off. Modules wire their own known sets as
 * `candidates`; the gate decides whether suggesting is legitimate, the distance decides
 * whether any candidate is near enough.
 */
export function suggestForCode(
  code: string,
  unknown: string,
  candidates: string[]
): string | undefined {
  if (!supportsSuggestions(code)) return undefined
  return suggest(unknown, candidates)
}

/**
 * Pick the closest candidate to an unknown name, or undefined when all are far off.
 * Mirrors the Rust helper exactly: within a third of the name, minimum three edits.
 */
export function suggest(unknown: string, candidates: string[]): string | undefined {
  const budget = Math.max(3, Math.floor(unknown.length / 3))
  let best: string | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const distance = editDistance(unknown, candidate)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return bestDistance <= budget ? best : undefined
}

function editDistance(first: string, second: string): number {
  const left = [...first]
  const right = [...second]
  let prev = right.map((_, index) => index)
  prev.push(right.length)
  for (let row = 0; row < left.length; row++) {
    const current = new Array<number>(right.length + 1)
    current[0] = row + 1
    for (let col = 0; col < right.length; col++) {
      const deletion = prev[col + 1]! + 1
      const insertion = current[col]! + 1
      const substitution = prev[col]! + (left[row] === right[col] ? 0 : 1)
      current[col + 1] = Math.min(deletion, insertion, substitution)
    }
    prev = current
  }
  return prev[right.length]!
}

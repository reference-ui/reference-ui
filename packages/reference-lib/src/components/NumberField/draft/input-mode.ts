/**
 * Grammar-derived keyboard hint (freeze decision 11, NF-ENV-07): the
 * inputMode follows the accepted character grammar and commit policy —
 * never UA detection, never resolved display rounding alone. Validate
 * mode and scientific grammars need the full keyboard; a nonnegative
 * lower bound drops the minus; authored fractional precision or a
 * fractional display step admits the decimal separator. Pure, proven by
 * its colocated suite.
 */
import type { NumberFieldCommitBehavior } from '../types'

// Grammar-derived inputMode (freeze decision 11, NF-ENV-07): follows the
// accepted character grammar and commit policy, never UA detection or
// resolved display rounding alone.
export function deriveInputMode(args: {
  commitBehavior: NumberFieldCommitBehavior
  min: number
  step: number
  percentStyle: boolean
  notation: string | undefined
  formatOptions: Intl.NumberFormatOptions | undefined
}): 'text' | 'decimal' | 'numeric' {
  const { commitBehavior, min, step, percentStyle, notation, formatOptions } = args
  // Validate mode keeps negative underflow editable even when min >= 0.
  if (commitBehavior === 'validate') return 'text'
  // Scientific/engineering grammars need exponent and sign characters.
  if (notation === 'scientific' || notation === 'engineering') return 'text'
  // Minus is accepted unless a nonnegative lower bound rejects it. 'none'
  // derives like snap (flagged for HQ in the mission log): it differs in
  // commit coercion, not in the minus grammar of nonnegative fields.
  if (min === -Infinity || min < 0) return 'text'
  // A fraction is admitted by authored precision or a fractional display
  // step. Resolved display rounding alone never admits it — neither the
  // percent default (0 digits) nor the currency default (2 digits) counts
  // as explicit fractional grammar (NF-COMP-03 direction).
  const authoredFraction =
    (formatOptions?.minimumFractionDigits ?? 0) > 0 ||
    (formatOptions?.maximumFractionDigits ?? 0) > 0 ||
    formatOptions?.minimumSignificantDigits !== undefined ||
    formatOptions?.maximumSignificantDigits !== undefined
  if (authoredFraction) return 'decimal'
  const displayStep = percentStyle ? step * 100 : step
  if (Math.abs(displayStep - Math.round(displayStep)) > 1e-9) return 'decimal'
  return 'numeric'
}

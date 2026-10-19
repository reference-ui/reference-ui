/**
 * Proof for the grammar-derived inputMode hint. Pins the full keyboard for
 * validate mode and scientific grammars, and fraction keys only from
 * authored precision or a fractional step.
 */
import { describe, expect, it } from 'vitest'
import { deriveInputMode } from './input-mode'

describe('grammar-derived inputMode', () => {
  it('keeps the full keyboard for validate mode and scientific grammars', () => {
    const base = { commitBehavior: 'none' as const, min: 0, step: 1, percentStyle: false, notation: undefined, formatOptions: undefined }
    expect(deriveInputMode({ ...base, commitBehavior: 'validate' })).toBe('text')
    expect(deriveInputMode({ ...base, notation: 'scientific' })).toBe('text')
    expect(deriveInputMode({ ...base, min: -10 })).toBe('text')
    expect(deriveInputMode(base)).toBe('numeric')
  })

  it('admits fractions only from authored precision or a fractional step', () => {
    const base = { commitBehavior: 'none' as const, min: 0, step: 1, percentStyle: false, notation: undefined, formatOptions: undefined }
    expect(deriveInputMode({ ...base, formatOptions: { maximumFractionDigits: 2 } })).toBe('decimal')
    expect(deriveInputMode({ ...base, step: 0.5 })).toBe('decimal')
    // Percent display scaling counts: step 0.01 over percent reads 1.
    expect(deriveInputMode({ ...base, step: 0.01, percentStyle: true })).toBe('numeric')
  })
})

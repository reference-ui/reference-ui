import { describe, expect, it } from 'vitest'
import { StrictColorUserTokenSamples } from './strict-color-user-tokens'

/**
 * Runtime hook so Vitest lists this suite; real checks are `tsc --noEmit` on:
 * - `strict-color-user-tokens.tsx` — consumer ColorToken values (`referenceUnitToken`, …)
 * - `strict-color-palette-tokens.ts` — palette steps (`blue.300`) vs `StrictColorValue`
 */
describe('strict color props (TypeScript)', () => {
  it('exports user-token fixture for compile-time checking', () => {
    expect(StrictColorUserTokenSamples).toBeTypeOf('function')
  })
})

import { describe, expect, it } from 'vitest'
import { StrictColorUserTokenSamples } from './strict-color-user-tokens'

/**
 * Runtime hook so Vitest lists this suite; real checks are `tsc --noEmit` on:
 * - `strict-color-user-tokens.tsx` — consumer ColorToken values (`referenceUnitToken`, …)
 * - `strict-color-palette-tokens.ts` — palette steps (`blue.300`) vs `StrictColorValue`
 */
describe('strict color props (TypeScript)', () => {
  // TODO(matrix/distro): Matrix distro covers generated color-prop narrowing and
  // custom generated token unions, but the remaining compile-only fixtures in this
  // folder still own extends/baseSystem and StyleProps-specific regressions.
  it('exports user-token fixture for compile-time checking', () => {
    expect(StrictColorUserTokenSamples).toBeTypeOf('function')
  })
})

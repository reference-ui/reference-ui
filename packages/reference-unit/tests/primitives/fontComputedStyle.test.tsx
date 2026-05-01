/**
 * @vitest-environment happy-dom
 *
 * Computed-style checks for font() / pattern `font` + `weight`.
 * Requires flattened @layer output so happy-dom applies Panda rules (see setup.ts).
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  appendFontWeightAtomicTieBreakForTests,
  injectDesignSystemCss,
} from './setup'
import {
  expectComputedFontFamilyIncludes,
  expectComputedFontWeight,
  requireDesignSystemCss,
} from '../utils/design-system-css'

beforeAll(() => {
  requireDesignSystemCss()
  injectDesignSystemCss({ flattenCascadeLayers: true })
  appendFontWeightAtomicTieBreakForTests()
})

describe('font + weight (computed styles)', () => {
  // MIGRATED: Covered by matrix/primitives/tests/e2e/primitives-contract.spec.ts
  // and matrix/font/tests/e2e/font-contract.spec.ts.
  it.skip('resolves sans preset to Inter stack and default recipe weight 400', () => {
    render(
      <Div data-testid="sans-default" font="sans">
        Text
      </Div>,
    )

    const el = screen.getByTestId('sans-default')
    expectComputedFontFamilyIncludes(el, 'Inter', 'font="sans" should set Inter in font-family')
    expectComputedFontWeight(el, 400, 'default sans recipe uses weight 400')
  })

  // MIGRATED: Covered by matrix/primitives/tests/e2e/primitives-contract.spec.ts
  // and matrix/font/tests/e2e/font-contract.spec.ts.
  it.skip('resolves weight shorthand bold to 700', () => {
    render(
      <Div data-testid="sans-bold" font="sans" weight="bold">
        Text
      </Div>,
    )

    const el = screen.getByTestId('sans-bold')
    expectComputedFontWeight(el, 700, 'weight="bold" should map to 700 per fonts.ts')
    expectComputedFontFamilyIncludes(el, 'Inter', 'font stack unchanged with weight')
  })

  // MIGRATED: Covered by matrix/primitives/tests/e2e/primitives-contract.spec.ts
  // and matrix/font/tests/e2e/font-contract.spec.ts.
  it.skip('resolves compound token sans.bold to 700', () => {
    render(
      <Div data-testid="sans-bold-token" font="sans" weight="sans.bold">
        Text
      </Div>,
    )

    const el = screen.getByTestId('sans-bold-token')
    expectComputedFontWeight(el, 700, 'weight="sans.bold" should map to 700')
  })

  // MIGRATED: Covered by matrix/primitives/tests/e2e/primitives-contract.spec.ts
  // and matrix/font/tests/e2e/font-contract.spec.ts.
  it.skip('applies font-level css letterSpacing from font()', () => {
    render(
      <Div data-testid="sans-ls" font="sans">
        Text
      </Div>,
    )

    const el = screen.getByTestId('sans-ls')
    const ls = window.getComputedStyle(el).letterSpacing
    // happy-dom often resolves -0.01em to px; either form is fine
    expect(parseFloat(ls), 'letterSpacing from font() css option').toBeLessThan(0)
  })
})

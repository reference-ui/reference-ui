/**
 * @vitest-environment happy-dom
 *
 * Tests rhythm spacing utilities: padding="2r" etc. map to calc(n * var(--spacing-r)).
 * Rhythm is a built-in extension in reference-core.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { injectDesignSystemCss, getDesignSystemCssPath } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS - tests will skip style assertions
  }
})

describe('rhythm spacing utilities', () => {
  // MIGRATED: Covered by matrix/spacing/tests/e2e/system-contract.spec.ts.
  it.skip('mounts a Div with padding="2r" and renders', () => {
    render(
      <Div data-testid="rhythm-div" padding="2r">
        Rhythm test
      </Div>
    )
    const el = screen.getByTestId('rhythm-div')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Rhythm test')
  })

  // MIGRATED: Covered by matrix/spacing/tests/e2e/system-contract.spec.ts.
  it.skip('mounts multi-value rhythm shorthands and preserves mixed CSS atoms', () => {
    render(
      <Div data-testid="rhythm-shorthand" padding="1r 2r" margin="1r auto">
        Rhythm shorthand test
      </Div>
    )

    const el = screen.getByTestId('rhythm-shorthand')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Rhythm shorthand test')
  })

  // MIGRATED: Covered by matrix/spacing/tests/e2e/system-contract.spec.ts.
  it.skip('applies rhythm padding when design system CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="rhythm-padding" padding="2r">
        Content
      </Div>
    )
    const el = screen.getByTestId('rhythm-padding')
    const style = window.getComputedStyle(el)
    // 2r = calc(2 * var(--spacing-r)), with --spacing-r = 16px by default → 32px
    if (style.paddingTop) {
      expect(Number.parseFloat(style.paddingTop)).toBeGreaterThan(0)
    }
  })

  // MIGRATED: Covered by matrix/spacing/tests/e2e/system-contract.spec.ts.
  it.skip('applies multi-value rhythm shorthands when design system CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="rhythm-shorthand-css" padding="1r 2r">
        Content
      </Div>
    )

    const el = screen.getByTestId('rhythm-shorthand-css')
    const style = window.getComputedStyle(el)

    if (style.paddingTop) {
      expect(Number.parseFloat(style.paddingTop)).toBeGreaterThan(0)
    }
    if (style.paddingRight) {
      expect(Number.parseFloat(style.paddingRight)).toBeGreaterThan(0)
    }
    if (style.paddingTop && style.paddingRight) {
      expect(Number.parseFloat(style.paddingRight)).toBeGreaterThan(
        Number.parseFloat(style.paddingTop),
      )
    }
  })
})

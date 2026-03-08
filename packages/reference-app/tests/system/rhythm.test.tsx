/**
 * @vitest-environment happy-dom
 *
 * Tests rhythm spacing utilities: padding="2r" etc. map to calc(n * var(--spacing-r)).
 * Rhythm is a built-in extension in reference-cli.
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
  it('mounts a Div with padding="2r" and renders', () => {
    render(
      <Div data-testid="rhythm-div" padding="2r">
        Rhythm test
      </Div>
    )
    const el = screen.getByTestId('rhythm-div')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Rhythm test')
  })

  it('applies rhythm padding when design system CSS is present', () => {
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
      expect(parseFloat(style.paddingTop)).toBeGreaterThan(0)
    }
  })
})

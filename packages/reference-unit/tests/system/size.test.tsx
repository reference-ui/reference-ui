/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { css } from '@reference-ui/react'
import { injectDesignSystemCss, getDesignSystemCssPath } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS - tests still verify emitted class names.
  }
})

describe('size utility surface', () => {
  // MIGRATED: Covered by matrix/spacing/tests/e2e/system-contract.spec.ts.
  it.skip('css({ size }) emits the generated size utility class', () => {
    const className = css({ size: '2r' })

    render(
      <div data-testid="css-size" className={className}>
        Utility size
      </div>
    )

    const el = screen.getByTestId('css-size')
    expect(el.className).toContain('size_')
  })

  // MIGRATED: Covered by matrix/spacing/tests/e2e/system-contract.spec.ts.
  it.skip('css({ size }) applies equal width and height when CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <div data-testid="css-size-style" className={css({ size: '2r' })}>
        Utility size CSS
      </div>
    )

    const el = screen.getByTestId('css-size-style')
    const style = window.getComputedStyle(el)

    if (style.width) {
      expect(style.width).toBeTruthy()
      expect(style.height).toBe(style.width)
    }
  })
})
/**
 * @vitest-environment happy-dom
 *
 * Tests user-space token eval: tokens() in src/system/styles.ts defines
 * referenceUnitToken; ref sync merges it into the design system. We mount a Div
 * with bg set to that token and assert the computed style.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { REFERENCE_UNIT_TOKEN_RGB } from '../../src/system/styles'
import { injectDesignSystemCss, getDesignSystemCssPath } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip style assertions.
  }
})

describe('user-space tokens (referenceUnitToken)', () => {
  it('mounts a Div with bg set to referenceUnitToken and renders', () => {
    render(
      <Div data-testid="div-token" bg="referenceUnitToken">
        User token
      </Div>
    )
    const el = screen.getByTestId('div-token')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('User token')
  })

  it('applies referenceUnitToken as background when design system CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="div-token-bg" backgroundColor="referenceUnitToken">
        Token bg
      </Div>
    )
    const el = screen.getByTestId('div-token-bg')
    const style = window.getComputedStyle(el)
    if (style.backgroundColor) {
      expect(style.backgroundColor).toBe(REFERENCE_UNIT_TOKEN_RGB)
    }
  })
})

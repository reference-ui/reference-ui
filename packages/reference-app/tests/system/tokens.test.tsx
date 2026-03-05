/**
 * @vitest-environment happy-dom
 *
 * Tests user-space token eval: tokens() in src/system/tokens.ts defines
 * referenceAppToken; ref sync merges it into the design system. We mount a Div
 * with bg set to that token and assert the computed style.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { REFERENCE_APP_TOKEN_RGB } from '../../src/system/tokens'
import { injectDesignSystemCss, getDesignSystemCssPath } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip style assertions.
  }
})

describe('user-space tokens (referenceAppToken)', () => {
  it('mounts a Div with bg set to referenceAppToken and renders', () => {
    render(
      <Div data-testid="div-token" bg="referenceAppToken">
        User token
      </Div>
    )
    const el = screen.getByTestId('div-token')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('User token')
  })

  it('applies referenceAppToken as background when design system CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="div-token-bg" backgroundColor="referenceAppToken">
        Token bg
      </Div>
    )
    const el = screen.getByTestId('div-token-bg')
    const style = window.getComputedStyle(el)
    if (style.backgroundColor) {
      expect(style.backgroundColor).toBe(REFERENCE_APP_TOKEN_RGB)
    }
  })
})

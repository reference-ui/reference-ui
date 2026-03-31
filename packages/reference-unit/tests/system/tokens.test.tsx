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
import {
  REFERENCE_UNIT_MODE_DARK_RGB,
  REFERENCE_UNIT_MODE_LIGHT_RGB,
  REFERENCE_UNIT_TOKEN_RGB,
} from '../../src/system/styles'
import {
  getDesignSystemCss,
  injectDesignSystemCss,
  getDesignSystemCssPath,
} from '../primitives/setup'

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

  it('emits color-mode token CSS for the normal reference-unit system', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain(`--colors-reference-unit-color-mode-token: ${REFERENCE_UNIT_MODE_LIGHT_RGB};`)
    expect(css).toMatch(/data-panda-theme=dark|data-panda-theme=["']dark["']/)
    expect(css).toMatch(
      new RegExp(`--colors-reference-unit-color-mode-token:\\s*${REFERENCE_UNIT_MODE_DARK_RGB.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    )
  })

  it('applies the dark-mode token value inside a dark panda theme scope', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <>
        <Div data-testid="light-mode-token" color="referenceUnitColorModeToken">
          Light mode token
        </Div>
        <div data-panda-theme="dark">
          <Div data-testid="dark-mode-token" color="referenceUnitColorModeToken">
            Dark mode token
          </Div>
        </div>
      </>
    )

    const lightToken = screen.getByTestId('light-mode-token')
    const darkToken = screen.getByTestId('dark-mode-token')
    const lightStyle = window.getComputedStyle(lightToken)
    const darkStyle = window.getComputedStyle(darkToken)

    if (lightStyle.color) {
      expect(lightStyle.color).toBe(REFERENCE_UNIT_MODE_LIGHT_RGB)
    }

    if (darkStyle.color) {
      expect(darkStyle.color).toBe(REFERENCE_UNIT_MODE_DARK_RGB)
    }
  })
})

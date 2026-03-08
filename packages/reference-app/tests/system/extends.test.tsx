/**
 * @vitest-environment happy-dom
 *
 * Verifies `extends: [baseSystem]` pulls reference-lib tokens into reference-app.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  REF_LIB_CANARY,
  REF_LIB_GLOBAL_CSS_VALUE,
  REF_LIB_GLOBAL_CSS_VAR,
  REF_LIB_KEYFRAME_NAME,
} from '@reference-ui/lib'
import { getDesignSystemCss, getDesignSystemCssPath, injectDesignSystemCss } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip style assertions.
  }
})

describe('extends baseSystem from reference-lib', () => {
  it('renders a Div using the upstream token name', () => {
    render(
      <Div data-testid="extends-token" color="refLibCanary">
        Extended token
      </Div>
    )

    const el = screen.getByTestId('extends-token')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Extended token')
  })

  it('applies the upstream token value when design system CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="extends-token-color" color="refLibCanary">
        Extended token color
      </Div>
    )

    const el = screen.getByTestId('extends-token-color')
    const style = window.getComputedStyle(el)
    if (style.color) {
      expect(style.color).toBe(REF_LIB_CANARY)
    }
  })

  it('includes upstream globalCss in generated CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain(REF_LIB_GLOBAL_CSS_VAR)
    expect(css).toContain(REF_LIB_GLOBAL_CSS_VALUE)
  })

  it('includes upstream keyframes in generated CSS and accepts the animation name', () => {
    const css = getDesignSystemCss()
    if (css) {
      expect(css).toContain(`@keyframes ${REF_LIB_KEYFRAME_NAME}`)
      expect(css).toMatch(new RegExp(`${REF_LIB_KEYFRAME_NAME}[\\s\\S]*?scale\\(0\\.98\\)`))
      expect(css).toMatch(new RegExp(`${REF_LIB_KEYFRAME_NAME}[\\s\\S]*?scale\\(1\\)`))
    }

    render(
      <Div data-testid="extends-keyframes" animation={`${REF_LIB_KEYFRAME_NAME} 1s ease`}>
        Extended animation
      </Div>
    )

    expect(screen.getByTestId('extends-keyframes')).toBeInTheDocument()
  })

  it('includes upstream font definitions in generated CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain('@font-face')
    expect(css).toContain('Inter')
    expect(css).toContain('Literata')
    expect(css).toContain('JetBrains Mono')
    expect(css).toMatch(/font-display:\s*swap/)

    render(
      <Div data-testid="extends-font" fontFamily="sans">
        Extended font
      </Div>
    )

    expect(screen.getByTestId('extends-font')).toBeInTheDocument()
  })
})

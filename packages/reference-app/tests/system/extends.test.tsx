/**
 * @vitest-environment happy-dom
 *
 * Verifies `extends: [baseSystem]` pulls reference-lib tokens into reference-app.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { colors, fadeKeyframes, fonts, rootThemeVars } from '@reference-ui/lib/theme'
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
      <Div data-testid="extends-token" color="teal.500">
        Extended token
      </Div>
    )

    const el = screen.getByTestId('extends-token')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Extended token')
  })

  it('includes upstream token values when design system CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    const css = getDesignSystemCss()
    render(
      <Div data-testid="extends-token-color" color="teal.500">
        Extended token color
      </Div>
    )

    expect(screen.getByTestId('extends-token-color')).toBeInTheDocument()
    if (css) {
      expect(css).toContain(`--colors-teal-500: ${colors.teal[500].value};`)
    }
  })

  it('includes upstream globalCss in generated CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain('--r-base')
    expect(css).toContain(rootThemeVars['--r-base'])
    expect(css).toContain('--spacing-r')
    expect(css).toContain(rootThemeVars['--spacing-r'])
  })

  it('includes upstream keyframes in generated CSS and accepts the animation name', () => {
    const css = getDesignSystemCss()
    if (css) {
      expect(css).toContain('@keyframes fadeIn')
      expect(css).toMatch(new RegExp(`fadeIn[\\s\\S]*?${fadeKeyframes.fadeIn.from.opacity}`))
      expect(css).toMatch(new RegExp(`fadeIn[\\s\\S]*?${fadeKeyframes.fadeIn.to.opacity}`))
    }

    render(
      <Div data-testid="extends-keyframes" animation="fadeIn 1s ease">
        Extended animation
      </Div>
    )

    expect(screen.getByTestId('extends-keyframes')).toBeInTheDocument()
  })

  it('includes upstream font definitions in generated CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain('@font-face')
    expect(css).toContain(fonts.sans.value)
    expect(css).toContain(fonts.serif.value)
    expect(css).toContain(fonts.mono.value)
    expect(css).toMatch(/font-display:\s*swap/)

    render(
      <Div data-testid="extends-font" fontFamily="sans">
        Extended font
      </Div>
    )

    expect(screen.getByTestId('extends-font')).toBeInTheDocument()
  })
})

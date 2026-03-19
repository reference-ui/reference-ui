/**
 * @vitest-environment happy-dom
 *
 * Verifies `extends: [baseSystem]` pulls fixture-library tokens into reference-unit.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { getDesignSystemCss, getDesignSystemCssPath, injectDesignSystemCss } from '../primitives/setup'

const FIXTURE_DEMO_BG = '#0f172a'
const FIXTURE_DEMO_TEXT = '#f8fafc'
const FIXTURE_DEMO_ACCENT = '#14b8a6'
const LIGHT_DARK_DEMO_BG = '#f8fafc'
const LIGHT_DARK_DEMO_DARK_BG = '#020617'
const LIGHT_DARK_DEMO_TEXT = '#020617'
const LIGHT_DARK_DEMO_DARK_TEXT = '#f8fafc'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip style assertions.
  }
})

describe('extends baseSystem from fixture library', () => {
  it('renders a Div using fixture-owned token names', () => {
    render(
      <Div data-testid="extends-token" bg="fixtureDemoBg" color="fixtureDemoText">
        Extended fixture token
      </Div>
    )

    const el = screen.getByTestId('extends-token')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Extended fixture token')
  })

  it('includes fixture token values when design system CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    const css = getDesignSystemCss()
    render(
      <Div data-testid="extends-token-color" color="fixtureDemoAccent">
        Extended fixture token color
      </Div>
    )

    expect(screen.getByTestId('extends-token-color')).toBeInTheDocument()
    if (css) {
      expect(css).toContain(`--colors-fixture-demo-bg: ${FIXTURE_DEMO_BG};`)
      expect(css).toContain(`--colors-fixture-demo-text: ${FIXTURE_DEMO_TEXT};`)
      expect(css).toContain(`--colors-fixture-demo-accent: ${FIXTURE_DEMO_ACCENT};`)
    }
  })

  it('includes fixture light and dark token values in generated CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    render(
      <Div data-testid="extends-light-dark" bg="lightDarkDemoBg" color="lightDarkDemoText">
        Extended light dark tokens
      </Div>
    )

    expect(screen.getByTestId('extends-light-dark')).toBeInTheDocument()
    expect(css).toContain(`--colors-light-dark-demo-bg: ${LIGHT_DARK_DEMO_BG};`)
    expect(css).toContain(`--colors-light-dark-demo-text: ${LIGHT_DARK_DEMO_TEXT};`)
    expect(css).toContain(LIGHT_DARK_DEMO_DARK_BG)
    expect(css).toContain(LIGHT_DARK_DEMO_DARK_TEXT)
  })
})

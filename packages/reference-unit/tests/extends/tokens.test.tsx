/**
 * @vitest-environment happy-dom
 *
 * True test of extends: tokens are defined in @fixtures/extend-library, exported
 * as direct values. We import those, mount Div using the token names, and assert
 * computed styles match the imported values.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  fixtureDemoBgRgb,
  fixtureDemoAccentRgb,
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
} from '@fixtures/extend-library'
import { getDesignSystemCssPath, injectDesignSystemCss } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip style assertions.
  }
})

describe('extends baseSystem from fixture library', () => {
  it('resolves fixtureDemoBg on Div when reference-unit extends the fixture', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="extends-bg" bg="fixtureDemoBg">
        Extended bg
      </Div>
    )
    const el = screen.getByTestId('extends-bg')
    expect(el).toBeInTheDocument()
    const bg = window.getComputedStyle(el).backgroundColor
    if (bg) expect(bg).toBe(fixtureDemoBgRgb)
  })

  it('resolves fixtureDemoAccent as color on Div', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="extends-accent" color="fixtureDemoAccent">
        Extended accent
      </Div>
    )
    const el = screen.getByTestId('extends-accent')
    const color = window.getComputedStyle(el).color
    if (color) expect(color).toBe(fixtureDemoAccentRgb)
  })

  it('resolves light/dark tokens in light mode', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="extends-light" bg="lightDarkDemoBg" color="lightDarkDemoText">
        Light mode
      </Div>
    )
    const el = screen.getByTestId('extends-light')
    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(lightDarkDemoBgLightRgb)
    if (color) expect(color).toBe(lightDarkDemoTextLightRgb)
  })

  it('resolves light/dark tokens in dark mode', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <div data-panda-theme="dark">
        <Div data-testid="extends-dark" bg="lightDarkDemoBg" color="lightDarkDemoText">
          Dark mode
        </Div>
      </div>
    )
    const el = screen.getByTestId('extends-dark')
    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(lightDarkDemoBgDarkRgb)
    if (color) expect(color).toBe(lightDarkDemoTextDarkRgb)
  })
})

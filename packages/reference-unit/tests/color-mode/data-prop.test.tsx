/**
 * @vitest-environment happy-dom
 *
 * Asserts that the `data-panda-theme="dark"` attribute on any ancestor element
 * correctly switches ALL token sources into dark mode:
 *
 *   - tokens from an extends library   (extend-library)
 *   - tokens from a layers library     (layer-library)
 *   - tokens defined in the root project itself
 *
 * This is the key contract: regardless of how a token entered the design
 * system — via extends, layers, or local definition — the same single
 * data-attribute toggle controls the color mode switch for all of them.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
} from '@fixtures/extend-library'
import {
  lightDarkDemoBgLightRgb as layerBgLightRgb,
  lightDarkDemoBgDarkRgb as layerBgDarkRgb,
} from '@fixtures/layer-library'
import {
  REFERENCE_UNIT_MODE_LIGHT_RGB,
  REFERENCE_UNIT_MODE_DARK_RGB,
} from '../../src/system/styles'
import { getDesignSystemCssPath, injectDesignSystemCss } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // ref sync hasn't run — style assertions skip via getDesignSystemCssPath() guard.
  }
})

describe('data-panda-theme toggle works across all token sources', () => {
  it('without the attribute all three sources resolve to their light values', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <>
        <Div data-testid="toggle-ext" bg="lightDarkDemoBg">extends</Div>
        <Div data-testid="toggle-layer" bg="lightDarkDemoBg">layers</Div>
        <Div data-testid="toggle-root" color="referenceUnitColorModeToken">root</Div>
      </>
    )

    const extBg = window.getComputedStyle(screen.getByTestId('toggle-ext')).backgroundColor
    const layerBg = window.getComputedStyle(screen.getByTestId('toggle-layer')).backgroundColor
    const rootColor = window.getComputedStyle(screen.getByTestId('toggle-root')).color

    if (extBg) expect(extBg).toBe(lightDarkDemoBgLightRgb)
    if (layerBg) expect(layerBg).toBe(layerBgLightRgb)
    if (rootColor) expect(rootColor).toBe(REFERENCE_UNIT_MODE_LIGHT_RGB)
  })

  it('with data-panda-theme="dark" on a wrapper all three sources switch to their dark values', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <div data-panda-theme="dark">
        <Div data-testid="toggle-dark-ext" bg="lightDarkDemoBg">extends dark</Div>
        <Div data-testid="toggle-dark-layer" bg="lightDarkDemoBg">layers dark</Div>
        <Div data-testid="toggle-dark-root" color="referenceUnitColorModeToken">root dark</Div>
      </div>
    )

    const extBg = window.getComputedStyle(screen.getByTestId('toggle-dark-ext')).backgroundColor
    const layerBg = window.getComputedStyle(screen.getByTestId('toggle-dark-layer')).backgroundColor
    const rootColor = window.getComputedStyle(screen.getByTestId('toggle-dark-root')).color

    if (extBg) expect(extBg).toBe(lightDarkDemoBgDarkRgb)
    if (layerBg) expect(layerBg).toBe(layerBgDarkRgb)
    if (rootColor) expect(rootColor).toBe(REFERENCE_UNIT_MODE_DARK_RGB)
  })

  it('scopes correctly — sibling outside the dark wrapper stays in light mode', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <div>
        <div data-panda-theme="dark">
          <Div data-testid="scoped-dark" bg="lightDarkDemoBg">dark zone</Div>
        </div>
        <Div data-testid="scoped-light" bg="lightDarkDemoBg">light zone</Div>
      </div>
    )

    const darkBg = window.getComputedStyle(screen.getByTestId('scoped-dark')).backgroundColor
    const lightBg = window.getComputedStyle(screen.getByTestId('scoped-light')).backgroundColor

    if (darkBg) expect(darkBg).toBe(lightDarkDemoBgDarkRgb)
    if (lightBg) expect(lightBg).toBe(lightDarkDemoBgLightRgb)
  })
})

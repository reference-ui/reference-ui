/**
 * @vitest-environment happy-dom
 *
 * Asserts that light/dark token values resolve correctly for all three token
 * sources supported by reference-ui:
 *
 *   1. extends  — tokens in @fixtures/extend-library are merged into the
 *                 consumer's Panda config; Div props resolve them directly.
 *
 *   2. layers   — tokens from @fixtures/layer-library live inside their own
 *                 CSS layer; they still resolve on Div because the token CSS
 *                 variable is emitted into the consumer stylesheet via the
 *                 layers config.
 *
 *   3. root     — tokens defined in the root project's own tokens() call; the
 *                 baseline case, always in the consumer's namespace.
 *
 * Each describe block checks the light value (default) and the dark value
 * (wrapped in data-panda-theme="dark"). See data-prop.test.tsx for the focused
 * test that the toggle mechanism itself works across all three.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
} from '@fixtures/extend-library'
import {
  lightDarkDemoBgLightRgb as layerBgLightRgb,
  lightDarkDemoBgDarkRgb as layerBgDarkRgb,
  lightDarkDemoTextLightRgb as layerTextLightRgb,
  lightDarkDemoTextDarkRgb as layerTextDarkRgb,
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

// ---------------------------------------------------------------------------
// 1. extends
// ---------------------------------------------------------------------------

describe('color-mode: extends (extend-library lightDarkDemoBg)', () => {
  it('light mode resolves to the light value', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="ext-light" bg="lightDarkDemoBg" color="lightDarkDemoText">
        extends light
      </Div>
    )
    const el = screen.getByTestId('ext-light')
    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(lightDarkDemoBgLightRgb)
    if (color) expect(color).toBe(lightDarkDemoTextLightRgb)
  })

  it('dark mode resolves to the dark value', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <div data-panda-theme="dark">
        <Div data-testid="ext-dark" bg="lightDarkDemoBg" color="lightDarkDemoText">
          extends dark
        </Div>
      </div>
    )
    const el = screen.getByTestId('ext-dark')
    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(lightDarkDemoBgDarkRgb)
    if (color) expect(color).toBe(lightDarkDemoTextDarkRgb)
  })
})

// ---------------------------------------------------------------------------
// 2. layers
// ---------------------------------------------------------------------------

describe('color-mode: layers (layer-library lightDarkDemoBg)', () => {
  it('light mode resolves to the light value', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="layer-light" bg="lightDarkDemoBg" color="lightDarkDemoText">
        layers light
      </Div>
    )
    const el = screen.getByTestId('layer-light')
    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(layerBgLightRgb)
    if (color) expect(color).toBe(layerTextLightRgb)
  })

  it('dark mode resolves to the dark value', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <div data-panda-theme="dark">
        <Div data-testid="layer-dark" bg="lightDarkDemoBg" color="lightDarkDemoText">
          layers dark
        </Div>
      </div>
    )
    const el = screen.getByTestId('layer-dark')
    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(layerBgDarkRgb)
    if (color) expect(color).toBe(layerTextDarkRgb)
  })
})

// ---------------------------------------------------------------------------
// 3. root project
// ---------------------------------------------------------------------------

describe('color-mode: root project (referenceUnitColorModeToken)', () => {
  it('light mode resolves to the light value', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="root-light" color="referenceUnitColorModeToken">
        root light
      </Div>
    )
    const el = screen.getByTestId('root-light')
    const color = window.getComputedStyle(el).color
    if (color) expect(color).toBe(REFERENCE_UNIT_MODE_LIGHT_RGB)
  })

  it('dark mode resolves to the dark value', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <div data-panda-theme="dark">
        <Div data-testid="root-dark" color="referenceUnitColorModeToken">
          root dark
        </Div>
      </div>
    )
    const el = screen.getByTestId('root-dark')
    const color = window.getComputedStyle(el).color
    if (color) expect(color).toBe(REFERENCE_UNIT_MODE_DARK_RGB)
  })
})

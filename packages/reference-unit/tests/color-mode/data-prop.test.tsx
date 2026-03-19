/**
 * @vitest-environment happy-dom
 *
 * Color mode is a consumer-controlled, global concern. These tests intentionally
 * document the contract we want: root tokens, extended libraries, and layered
 * libraries should all respond when the consumer toggles theme state.
 */

import { beforeAll, describe, it } from 'vitest'
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
import { injectDesignSystemCss } from '../primitives/setup'
import { expectResolvedRgb, requireDesignSystemCss } from '../utils/design-system-css'

beforeAll(() => {
  requireDesignSystemCss()
  injectDesignSystemCss({ flattenCascadeLayers: true })
})

describe('consumer token resolution in light mode', () => {
  it('consumer primitives resolve extended library color-mode tokens in light mode', () => {
    render(
      <Div data-testid="ext" bg="lightDarkDemoBg" color="lightDarkDemoText">
        e
      </Div>,
    )

    expectResolvedRgb(
      screen.getByTestId('ext'),
      'backgroundColor',
      lightDarkDemoBgLightRgb,
      'extended library token resolves on consumer primitive in light mode',
    )
    expectResolvedRgb(
      screen.getByTestId('ext'),
      'color',
      lightDarkDemoTextLightRgb,
      'extended library text token resolves on consumer primitive in light mode',
    )
  })

  it('consumer primitives resolve layered public color-mode tokens in light mode', () => {
    render(
      <Div data-testid="layer" bg="lightDarkDemoBg" color="lightDarkDemoText">
        l
      </Div>,
    )

    expectResolvedRgb(
      screen.getByTestId('layer'),
      'backgroundColor',
      layerBgLightRgb,
      'layered public token resolves on consumer primitive in light mode',
    )
    expectResolvedRgb(
      screen.getByTestId('layer'),
      'color',
      layerTextLightRgb,
      'layered public text token resolves on consumer primitive in light mode',
    )
  })

  it('consumer primitives resolve root color-mode tokens in light mode', () => {
    render(
      <Div data-testid="root" color="referenceUnitColorModeToken">
        r
      </Div>,
    )

    expectResolvedRgb(
      screen.getByTestId('root'),
      'color',
      REFERENCE_UNIT_MODE_LIGHT_RGB,
      'root color-mode token resolves on consumer primitive in light mode',
    )
  })
})

describe('global dark-mode control from the consumer', () => {
  it('ancestor theme wrapper flips extended library tokens to dark', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="ext-wrap" bg="lightDarkDemoBg" color="lightDarkDemoText">
          e
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('ext-wrap'),
      'backgroundColor',
      lightDarkDemoBgDarkRgb,
      'ancestor dark theme flips extended library background token',
    )
    expectResolvedRgb(
      screen.getByTestId('ext-wrap'),
      'color',
      lightDarkDemoTextDarkRgb,
      'ancestor dark theme flips extended library text token',
    )
  })

  it('ancestor theme wrapper flips layered public tokens to dark', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="layer-wrap" bg="lightDarkDemoBg" color="lightDarkDemoText">
          l
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('layer-wrap'),
      'backgroundColor',
      layerBgDarkRgb,
      'ancestor dark theme flips layered public background token',
    )
    expectResolvedRgb(
      screen.getByTestId('layer-wrap'),
      'color',
      layerTextDarkRgb,
      'ancestor dark theme flips layered public text token',
    )
  })

  it('ancestor theme wrapper flips root color-mode tokens to dark', () => {
    render(
      <div data-panda-theme="dark">
        <Div data-testid="root-wrap" color="referenceUnitColorModeToken">
          r
        </Div>
      </div>,
    )

    expectResolvedRgb(
      screen.getByTestId('root-wrap'),
      'color',
      REFERENCE_UNIT_MODE_DARK_RGB,
      'ancestor dark theme flips root color-mode token',
    )
  })
})

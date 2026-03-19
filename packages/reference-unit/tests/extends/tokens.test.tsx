/**
 * @vitest-environment happy-dom
 *
 * Extends adopts upstream tokens into the consumer token space. If a consumer
 * uses an extended-library token name on a primitive, that token should resolve.
 * Color-mode propagation is covered separately in `tests/color-mode/data-prop.test.tsx`.
 */

import { beforeAll, describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  fixtureDemoBgRgb,
  fixtureDemoAccentRgb,
  lightDarkDemoBgLightRgb,
  lightDarkDemoTextLightRgb,
} from '@fixtures/extend-library'
import { injectDesignSystemCss } from '../primitives/setup'
import { expectResolvedRgb, requireDesignSystemCss } from '../utils/design-system-css'

beforeAll(() => {
  requireDesignSystemCss()
  injectDesignSystemCss({ flattenCascadeLayers: true })
})

describe('extends baseSystem from fixture library', () => {
  it('consumer primitive resolves extended background token by name', () => {
    render(
      <Div data-testid="extends-bg" bg="fixtureDemoBg">
        Extended bg
      </Div>,
    )
    const el = screen.getByTestId('extends-bg')
    expectResolvedRgb(el, 'backgroundColor', fixtureDemoBgRgb, 'consumer primitive resolves extended background token')
  })

  it('consumer primitive resolves extended accent token by name', () => {
    render(
      <Div data-testid="extends-accent" color="fixtureDemoAccent">
        Extended accent
      </Div>,
    )
    const el = screen.getByTestId('extends-accent')
    expectResolvedRgb(el, 'color', fixtureDemoAccentRgb, 'consumer primitive resolves extended accent token')
  })

  it('consumer primitive resolves extended public color tokens in light mode', () => {
    render(
      <Div data-testid="extends-light" bg="lightDarkDemoBg" color="lightDarkDemoText">
        Light mode
      </Div>,
    )
    const el = screen.getByTestId('extends-light')
    expectResolvedRgb(el, 'backgroundColor', lightDarkDemoBgLightRgb, 'consumer primitive resolves extended public background token')
    expectResolvedRgb(el, 'color', lightDarkDemoTextLightRgb, 'consumer primitive resolves extended public text token')
  })
})

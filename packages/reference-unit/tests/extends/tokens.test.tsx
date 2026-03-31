/**
 * @vitest-environment happy-dom
 *
 * Extends adopts upstream tokens into the consumer token space. If a consumer
 * uses an extended-library token name on a primitive, that token should resolve.
 * Color-mode propagation is covered separately in `tests/color-mode/data-prop.test.tsx`.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  fixtureDemoBgRgb,
  fixtureDemoAccentRgb,
  lightDarkDemoBgLightRgb,
  lightDarkDemoTextLightRgb,
} from '@fixtures/extend-library'
import { injectDesignSystemCss } from '../primitives/setup'
import { readGeneratedFile } from '../system/customProps-output.helpers'
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

  it('consumer stylesheet emits typography utility classes used alongside extended color-mode tokens', () => {
    const css = readGeneratedFile('styled', 'styles.css')

    expect(css).toBeDefined()
    expect(css).toContain('.ff_sans')
    expect(css).toContain('.fs_60px')
    expect(css).toContain('.lh_70px')
    expect(css).toContain('.white-space_nowrap')
  })
})

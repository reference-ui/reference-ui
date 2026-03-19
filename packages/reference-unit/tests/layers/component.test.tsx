/**
 * @vitest-environment happy-dom
 *
 * Mount the layered fixture component and assert that its own authored markup
 * resolves correctly inside the library layer. Global theme control is covered
 * separately in `tests/color-mode/data-prop.test.tsx`.
 */

import { beforeAll, describe, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LightDarkDemo } from '@fixtures/layer-library'
import {
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
} from '@fixtures/layer-library'
import { injectDesignSystemCss } from '../primitives/setup'
import { expectResolvedRgb, requireDesignSystemCss } from '../utils/design-system-css'

beforeAll(() => {
  requireDesignSystemCss()
  injectDesignSystemCss({ flattenCascadeLayers: true })
})

describe('LightDarkDemo (layer-library)', () => {
  it('light panel resolves layered public tokens', () => {
    render(<LightDarkDemo />)
    const el = screen.getByTestId('light-dark-demo-light')
    expectResolvedRgb(el, 'backgroundColor', lightDarkDemoBgLightRgb, 'layered demo light panel background')
    expectResolvedRgb(el, 'color', lightDarkDemoTextLightRgb, 'layered demo light panel text')
  })

  it('dark panel resolves layered public dark overrides on the authored node', () => {
    render(<LightDarkDemo />)
    const el = screen.getByTestId('light-dark-demo-dark')
    expectResolvedRgb(el, 'backgroundColor', lightDarkDemoBgDarkRgb, 'layered demo dark panel background')
    expectResolvedRgb(el, 'color', lightDarkDemoTextDarkRgb, 'layered demo dark panel text')
  })
})

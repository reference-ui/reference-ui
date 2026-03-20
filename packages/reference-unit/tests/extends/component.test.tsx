/**
 * @vitest-environment happy-dom
 *
 * Same layout as @fixtures/extend-library LightDarkDemo, but markup is inlined
 * here on purpose: importing that module runs a top-level tokens() that fights
 * reference-unit’s runtime and leaves backgrounds unresolved in tests. Token
 * values for assertions still come from the fixture.
 *
 * This suite is about extended fixture markup resolving correctly once the
 * consumer has adopted the library. Global theme control is covered separately
 * in `tests/color-mode/data-prop.test.tsx`.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div, Span } from '@reference-ui/react'
import {
  lightDarkDemoBgLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoTextDarkRgb,
} from '@fixtures/extend-library'
import { injectDesignSystemCss } from '../primitives/setup'
import { expectResolvedRgb, requireDesignSystemCss } from '../utils/design-system-css'

/** Mirrors fixtures/extend-library LightDarkDemo.tsx (without tokens() side effects). */
function ExtendLightDarkDemoLayout() {
  return (
    <Div
      data-testid="light-dark-demo"
      display="grid"
      gridTemplateColumns="repeat(2, minmax(0, 1fr))"
      gap="4r"
    >
      <Div
        data-testid="light-dark-demo-light"
        bg="lightDarkDemoBg"
        color="lightDarkDemoText"
        borderRadius="xl"
        padding="5r"
        display="flex"
        flexDirection="column"
        gap="2r"
      >
        <Span data-testid="light-dark-demo-light-title" fontWeight="600" color="lightDarkDemoText">
          Light mode
        </Span>
        <Span data-testid="light-dark-demo-light-copy" color="lightDarkDemoText">
          Uses the default token values.
        </Span>
      </Div>

      <Div
        data-testid="light-dark-demo-dark"
        colorMode="dark"
        bg="lightDarkDemoBg"
        color="lightDarkDemoText"
        borderRadius="xl"
        padding="5r"
        display="flex"
        flexDirection="column"
        gap="2r"
      >
        <Span data-testid="light-dark-demo-dark-title" fontWeight="600" color="lightDarkDemoText">
          Dark mode
        </Span>
        <Span data-testid="light-dark-demo-dark-copy" color="lightDarkDemoText">
          Uses the dark token overrides.
        </Span>
      </Div>
    </Div>
  )
}

beforeAll(() => {
  requireDesignSystemCss()
  injectDesignSystemCss({ flattenCascadeLayers: true })
})

describe('extend-library demo layout (inlined)', () => {
  it('light panel resolves extended library tokens', () => {
    render(<ExtendLightDarkDemoLayout />)
    const el = screen.getByTestId('light-dark-demo-light')
    expectResolvedRgb(el, 'backgroundColor', lightDarkDemoBgLightRgb, 'extended demo light panel background')
    expectResolvedRgb(el, 'color', lightDarkDemoTextLightRgb, 'extended demo light panel text')
  })

  it('dark panel resolves extended library dark overrides on the authored node', () => {
    render(<ExtendLightDarkDemoLayout />)
    const el = screen.getByTestId('light-dark-demo-dark')
    expectResolvedRgb(el, 'backgroundColor', lightDarkDemoBgDarkRgb, 'extended demo dark panel background')
    expectResolvedRgb(el, 'color', lightDarkDemoTextDarkRgb, 'extended demo dark panel text')
  })

  it('extended tokens can coexist with large typography utility props on a dark authored node', () => {
    render(
      <Div
        data-testid="extend-typography-dark"
        colorMode="dark"
        bg="lightDarkDemoBg"
        color="lightDarkDemoText"
        font="sans"
        fontSize="60px"
        lineHeight="70px"
        whiteSpace="nowrap"
      >
        Typography
      </Div>,
    )

    const el = screen.getByTestId('extend-typography-dark')
    const style = window.getComputedStyle(el)

    expectResolvedRgb(el, 'backgroundColor', lightDarkDemoBgDarkRgb, 'extended dark node keeps background token')
    expectResolvedRgb(el, 'color', lightDarkDemoTextDarkRgb, 'extended dark node keeps text token')
    expect(style.fontSize).toBe('60px')
    expect(style.lineHeight).toBe('70px')
    expect(style.whiteSpace).toBe('nowrap')
  })
})

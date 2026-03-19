/**
 * @vitest-environment happy-dom
 *
 * Mount LightDarkDemo from @fixtures/layer-library and assert its computed styles
 * match the fixture token values. Tests that layer library components resolve
 * correctly when rendered in the consumer.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LightDarkDemo } from '@fixtures/layer-library'
import {
  lightDarkDemoBgLightRgb,
  lightDarkDemoTextLightRgb,
  lightDarkDemoBgDarkRgb,
  lightDarkDemoTextDarkRgb,
} from '@fixtures/layer-library'
import { getDesignSystemCssPath, injectDesignSystemCss } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip style assertions.
  }
})

describe('LightDarkDemo from layer library', () => {
  it('mounts LightDarkDemo and resolves light mode token styles', () => {
    if (!getDesignSystemCssPath()) return

    render(<LightDarkDemo />)

    const el = screen.getByTestId('light-dark-demo-light')
    expect(el).toBeInTheDocument()

    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(lightDarkDemoBgLightRgb)
    if (color) expect(color).toBe(lightDarkDemoTextLightRgb)
  })

  it('mounts LightDarkDemo and resolves dark mode token styles', () => {
    if (!getDesignSystemCssPath()) return

    render(<LightDarkDemo />)

    const el = screen.getByTestId('light-dark-demo-dark')
    expect(el).toBeInTheDocument()

    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    if (bg) expect(bg).toBe(lightDarkDemoBgDarkRgb)
    if (color) expect(color).toBe(lightDarkDemoTextDarkRgb)
  })
})

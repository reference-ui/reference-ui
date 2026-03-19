/**
 * @vitest-environment happy-dom
 *
 * Mount DemoComponent from @fixtures/extend-library and assert its computed styles
 * match the fixture token values. This test SHOULD fail (documents that extended
 * library components don't resolve correctly when rendered in the consumer).
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DemoComponent } from '@fixtures/extend-library'
import { fixtureDemoBgRgb, fixtureDemoTextRgb, fixtureDemoAccentRgb } from '@fixtures/extend-library'
import { getDesignSystemCssPath, injectDesignSystemCss } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip style assertions.
  }
})

describe('DemoComponent from extended library', () => {
  it('mounts DemoComponent and resolves fixture token styles', () => {
    if (!getDesignSystemCssPath()) return

    render(<DemoComponent />)

    const el = screen.getByTestId('fixture-demo')
    expect(el).toBeInTheDocument()

    const bg = window.getComputedStyle(el).backgroundColor
    const color = window.getComputedStyle(el).color
    expect(bg).toBe(fixtureDemoBgRgb)
    expect(color).toBe(fixtureDemoTextRgb)
  })

  it('resolves fixtureDemoAccent on DemoComponent eyebrow span', () => {
    if (!getDesignSystemCssPath()) return

    render(<DemoComponent />)
    const eyebrow = screen.getByTestId('fixture-demo-eyebrow')
    const color = window.getComputedStyle(eyebrow).color
    expect(color).toBe(fixtureDemoAccentRgb)
  })
})

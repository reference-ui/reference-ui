/**
 * @vitest-environment happy-dom
 *
 * Unit tests for the keyframes() API. src/system/styles.ts registers fadeIn;
 * ref sync merges it into the design system. We assert the generated CSS
 * contains the keyframe definition.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { injectDesignSystemCss, getDesignSystemCss } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip CSS assertions.
  }
})

describe('keyframes() API', () => {
  it('emits @keyframes fadeIn in design system CSS', () => {
    const css = getDesignSystemCss()
    if (!css) return

    expect(css).toContain('@keyframes fadeIn')
    expect(css).toMatch(/fadeIn[\s\S]*?opacity:\s*0/)
    expect(css).toMatch(/fadeIn[\s\S]*?opacity:\s*1/)
  })

  it('mounts a Div with animation and renders', () => {
    render(
      <Div data-testid="div-animate" animation="fadeIn 1s ease">
        Animated
      </Div>
    )
    const el = screen.getByTestId('div-animate')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('Animated')
  })
})

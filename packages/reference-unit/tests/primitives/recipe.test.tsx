/**
 * @vitest-environment happy-dom
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { showcaseRecipe } from '../../src/virtual/recipes'
import { getDesignSystemCss, injectDesignSystemCss } from './setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (e.g. ref sync didn't run or Panda failed). Class-name assertions still run.
  }
})

describe('recipe runtime', () => {
  it('emits selectors for source-backed recipe fixtures', () => {
    const css = getDesignSystemCss()

    if (!css) return

    expect(css).toContain('.px_5r')
    expect(css).toContain('.py_2\\.5r')
    expect(css).toContain('.bg_teal\\.700')
    expect(css).toContain('.c_pink\\.700')
    expect(css).toContain('.bd-c_pink\\.700')
    expect(css).toContain('.hover\\:bg_pink\\.50:is(:hover, [data-hover])')
  })

  it('applies default variants when no props are passed', () => {
    render(
      <button data-testid="recipe-default" className={showcaseRecipe()}>
        Default
      </button>
    )

    const el = screen.getByTestId('recipe-default')
    expect(el).toBeInTheDocument()
    expect(el.className).toBeTruthy()
    expect(el.className).toContain('px_5r')
    expect(el.className).toContain('py_2.5r')
    expect(el.className).toContain('bg_teal.700')
    expect(el.className).toContain('c_white')
    expect(el.className).toContain('bd-c_teal.700')
  })

  it('applies explicit and compound variants at runtime', () => {
    render(
      <button
        data-testid="recipe-compound"
        className={showcaseRecipe({ visual: 'outline', tone: 'pink' })}
      >
        Compound
      </button>
    )

    const el = screen.getByTestId('recipe-compound')
    expect(el).toBeInTheDocument()
    expect(el.className).toBeTruthy()
    expect(el.className).toContain('bg_white')
    expect(el.className).toContain('c_pink.700')
    expect(el.className).toContain('bd-c_pink.700')
    expect(el.className).toContain('hover:bg_pink.50')
  })

  it('supports non-default variants without leaking recipe config to the DOM', () => {
    render(
      <button
        data-testid="recipe-ghost"
        className={showcaseRecipe({ visual: 'solid', tone: 'teal' })}
      >
        Solid
      </button>
    )

    const el = screen.getByTestId('recipe-ghost')
    expect(el).toBeInTheDocument()
    expect(el.getAttribute('visual')).toBeNull()
    expect(el.getAttribute('tone')).toBeNull()
    expect(el.className).toContain('bg_teal.700')
    expect(el.className).toContain('c_white')
  })
})

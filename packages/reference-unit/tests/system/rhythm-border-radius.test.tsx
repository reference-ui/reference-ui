/**
 * @vitest-environment happy-dom
 *
 * Integration tests: rhythm border-radius utilities in the generated design system
 * (borderRadius="2r", pair shorthands), literal px, and radii tokens (e.g. lg).
 * These assert the emitted classes and generated CSS rules, which is more robust
 * than parsing happy-dom radius values from `calc(...)`.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import {
  flattenCssCascadeLayersForTests,
  getDesignSystemCss,
  injectDesignSystemCss,
} from '../primitives/setup'
import { requireDesignSystemCss } from '../utils/design-system-css'

let designSystemCss = ''

function cssRule(selector: string): string {
  const blocks = [...designSystemCss.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter((match) => match[1]?.includes(`.${selector}`))
    .map((match) => `${match[1].trim()} {${match[2]}}`)

  expect(blocks, `missing CSS rule for .${selector}`).toBeTruthy()
  return blocks.join('\n')
}

beforeAll(() => {
  requireDesignSystemCss()
  injectDesignSystemCss({ flattenCascadeLayers: true })
  designSystemCss = flattenCssCascadeLayersForTests(getDesignSystemCss() ?? '')
})

describe('rhythm border radius (design system CSS)', () => {
  it('borderRadius="2r" emits the rhythm border radius class and calc rule', () => {
    render(
      <Div data-testid="r2-all" borderRadius="2r">
        x
      </Div>,
    )
    const el = screen.getByTestId('r2-all')
    expect(el.className).toContain('bdr_2r')

    const rule = cssRule('bdr_2r')
    expect(rule).toContain('border-radius: calc(2 * var(--spacing-r));')
  })

  it('borderRadius="12px" still works as a normal literal radius prop', () => {
    render(
      <Div data-testid="px12" borderRadius="12px">
        x
      </Div>,
    )
    const el = screen.getByTestId('px12')
    const s = window.getComputedStyle(el)
    expect(el.className).toContain('bdr_12px')
    expect(s.borderTopLeftRadius).toBe('12px')
    expect(s.borderTopRightRadius).toBe('12px')
    expect(s.borderBottomLeftRadius).toBe('12px')
    expect(s.borderBottomRightRadius).toBe('12px')
  })

  it('borderRadius="lg" resolves through the radii token pipeline', () => {
    render(
      <Div data-testid="lg" borderRadius="lg">
        x
      </Div>,
    )
    const el = screen.getByTestId('lg')
    expect(el.className).toContain('bdr_lg')

    const rule = cssRule('bdr_lg')
    expect(rule).toContain('border-radius: var(--radii-lg);')
  })

  it('borderTopRadius="2r" emits both top corner declarations', () => {
    render(
      <Div data-testid="top-pair" borderTopRadius="2r">
        x
      </Div>,
    )
    const el = screen.getByTestId('top-pair')
    expect(el.className).toContain('bdr-t_2r')

    const rule = cssRule('bdr-t_2r')
    expect(rule).toContain('border-top-left-radius: calc(2 * var(--spacing-r));')
    expect(rule).toContain('border-top-right-radius: calc(2 * var(--spacing-r));')
  })

  it('borderBottomRadius="2r" emits both bottom corner declarations', () => {
    render(
      <Div data-testid="bottom-pair" borderBottomRadius="2r">
        x
      </Div>,
    )
    const el = screen.getByTestId('bottom-pair')
    expect(el.className).toContain('bdr-b_2r')

    const rule = cssRule('bdr-b_2r')
    expect(rule).toContain('border-bottom-left-radius: calc(2 * var(--spacing-r));')
    expect(rule).toContain('border-bottom-right-radius: calc(2 * var(--spacing-r));')
  })

  it('borderLeftRadius="2r" emits both left corner declarations', () => {
    render(
      <Div data-testid="left-pair" borderLeftRadius="2r">
        x
      </Div>,
    )
    const el = screen.getByTestId('left-pair')
    expect(el.className).toContain('bdr-l_2r')

    const rule = cssRule('bdr-l_2r')
    expect(rule).toContain('border-top-left-radius: calc(2 * var(--spacing-r));')
    expect(rule).toContain('border-bottom-left-radius: calc(2 * var(--spacing-r));')
  })

  it('borderRightRadius="2r" emits both right corner declarations', () => {
    render(
      <Div data-testid="right-pair" borderRightRadius="2r">
        x
      </Div>,
    )
    const el = screen.getByTestId('right-pair')
    expect(el.className).toContain('bdr-r_2r')

    const rule = cssRule('bdr-r_2r')
    expect(rule).toContain('border-top-right-radius: calc(2 * var(--spacing-r));')
    expect(rule).toContain('border-bottom-right-radius: calc(2 * var(--spacing-r));')
  })

  it('borderStartRadius and borderEndRadius emit both logical corner declarations', () => {
    render(
      <Div data-testid="start-pair" borderStartRadius="2r">
        x
      </Div>,
    )
    render(
      <Div data-testid="end-pair" borderEndRadius="2r">
        x
      </Div>,
    )

    const startEl = screen.getByTestId('start-pair')
    expect(startEl.className).toContain('bdr-s_2r')

    const startRule = cssRule('bdr-s_2r')
    expect(startRule).toContain('border-start-start-radius: calc(2 * var(--spacing-r));')
    expect(startRule).toContain('border-end-start-radius: calc(2 * var(--spacing-r));')

    const endEl = screen.getByTestId('end-pair')
    expect(endEl.className).toContain('bdr-e_2r')

    const endRule = cssRule('bdr-e_2r')
    expect(endRule).toContain('border-start-end-radius: calc(2 * var(--spacing-r));')
    expect(endRule).toContain('border-end-end-radius: calc(2 * var(--spacing-r));')
  })
})

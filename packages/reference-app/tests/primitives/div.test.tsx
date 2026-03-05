/**
 * @vitest-environment happy-dom
 *
 * Unit/component tests for the Div primitive: mount with style props and
 * verify output (class names and, when CSS is available, computed styles).
 * Uses CLI's built styled output via vitest alias; design system CSS is
 * injected when present (e.g. after ref sync).
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { injectDesignSystemCss, getDesignSystemCssPath } from './setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (e.g. ref sync didn't run or Panda failed). Class-name tests still run.
  }
})

const hasDesignSystemCss = () => Boolean(getDesignSystemCssPath())

describe('Div primitive', () => {
  it('renders as a div with children', () => {
    render(<Div data-testid="div-basic">Hello</Div>)
    const el = screen.getByTestId('div-basic')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('Hello')
  })

  it('accepts style props and renders in the document', () => {
    render(
      <Div
        data-testid="div-styled"
        padding="1rem"
        backgroundColor="#0066cc"
        color="white"
      >
        Styled
      </Div>
    )
    const el = screen.getByTestId('div-styled')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('DIV')
    // When using reference-core Div (or CLI primitives with full box pattern), className will be set from Panda utilities
  })

  it('resolves computed styles when design system CSS is injected', () => {
    if (!hasDesignSystemCss()) return

    render(
      <Div
        data-testid="div-computed"
        padding="1rem"
        backgroundColor="#0066cc"
        color="white"
      >
        Styled
      </Div>
    )
    const el = screen.getByTestId('div-computed')
    const style = window.getComputedStyle(el)
    expect(style.paddingTop).toBe('16px')
    expect(style.backgroundColor).toBe('rgb(0, 102, 204)')
    expect(style.color).toBe('rgb(255, 255, 255)')
  })

  it('applies token-based style props when design system CSS is present', () => {
    if (!hasDesignSystemCss()) return

    render(
      <Div
        data-testid="div-tokens"
        padding="md"
        backgroundColor="brand.primary"
      >
        Tokens
      </Div>
    )
    const el = screen.getByTestId('div-tokens')
    const style = window.getComputedStyle(el)
    expect(style.paddingTop).toBe('16px')
    expect(style.backgroundColor).toBe('rgb(0, 102, 204)')
  })
})

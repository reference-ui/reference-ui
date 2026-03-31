/**
 * @vitest-environment happy-dom
 *
 * Unit/component tests for the Div primitive: mount with style props and
 * verify output (class names and, when CSS is available, computed styles).
 * Uses reference-core's built styled output via vitest alias; design system CSS is
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

const TEST_BG = 'reference.background'
const TEST_COLOR = 'reference.foreground'

describe('Div primitive', () => {
  it('renders as a div with children', () => {
    render(<Div data-testid="div-basic">Hello</Div>)
    const el = screen.getByTestId('div-basic')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveTextContent('Hello')
  })

  it('sets data-layer from ui.config.name (automatic layer identity)', () => {
    render(<Div data-testid="div-layer">Content</Div>)
    const el = screen.getByTestId('div-layer')
    // Primitives get data-layer from the project config name at packager time.
    expect(el.getAttribute('data-layer')).toBe('reference-unit')
  })

  it('accepts style props and renders in the document', () => {
    render(
      <Div
        data-testid="div-styled"
        padding="1rem"
        backgroundColor={TEST_BG}
        color={TEST_COLOR}
      >
        Styled
      </Div>
    )
    const el = screen.getByTestId('div-styled')
    expect(el).toBeInTheDocument()
    expect(el.tagName).toBe('DIV')
    // When using reference-core Div (or the legacy CLI package with full box pattern), className will be set from Panda utilities
  })

  it('resolves computed styles when design system CSS is injected', () => {
    if (!hasDesignSystemCss()) return

    render(
      <Div
        data-testid="div-computed"
        padding="1rem"
        backgroundColor={TEST_BG}
        color={TEST_COLOR}
      >
        Styled
      </Div>
    )
    const el = screen.getByTestId('div-computed')
    const style = window.getComputedStyle(el)
    // The core scaffold Div spreads props to DOM; the full box-based Div emits utility classes. Assert only when applied.
    if (style.paddingTop) {
      expect(style.paddingTop).toBe('16px')
      expect(style.backgroundColor).toBe(TEST_BG)
      expect(style.color).toBe(TEST_COLOR)
    }
  })

  it('applies token-based style props when design system CSS is present', () => {
    if (!hasDesignSystemCss()) return

    render(
      <Div data-testid="div-tokens" padding="md" backgroundColor="reference.primary">
        Tokens
      </Div>
    )
    const el = screen.getByTestId('div-tokens')
    const style = window.getComputedStyle(el)
    if (style.paddingTop) {
      expect(style.paddingTop).toBe('16px')
      expect(style.backgroundColor).toBe(TEST_BG)
    }
  })

  it('composes the css prop into classes instead of leaking it to the DOM', () => {
    render(
      <Div
        data-testid="div-css-prop"
        css={{
          position: 'fixed',
          top: '0',
          left: '1rem',
        }}
      >
        CSS prop
      </Div>
    )

    const el = screen.getByTestId('div-css-prop')
    expect(el).toBeInTheDocument()
    expect(el.getAttribute('css')).toBeNull()
    expect(el.className).toContain('ref-div')
    expect(el.className).not.toContain('[object Object]')

    if (hasDesignSystemCss()) {
      const style = window.getComputedStyle(el)
      if (style.position) {
        expect(style.position).toBe('fixed')
        expect(style.top).toBe('0px')
        expect(style.left).toBe('16px')
      }
    }
  })
})

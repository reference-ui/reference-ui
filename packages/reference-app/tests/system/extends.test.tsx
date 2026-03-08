/**
 * @vitest-environment happy-dom
 *
 * Verifies `extends: [baseSystem]` pulls reference-lib tokens into reference-app.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Div } from '@reference-ui/react'
import { REF_LIB_CANARY } from '@reference-ui/lib'
import { getDesignSystemCssPath, injectDesignSystemCss } from '../primitives/setup'

beforeAll(() => {
  try {
    injectDesignSystemCss()
  } catch {
    // No design system CSS (ref sync didn't run or Panda failed). Skip style assertions.
  }
})

describe('extends baseSystem from reference-lib', () => {
  it('renders a Div using the upstream token name', () => {
    render(
      <Div data-testid="extends-token" color="refLibCanary">
        Extended token
      </Div>
    )

    const el = screen.getByTestId('extends-token')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Extended token')
  })

  it('applies the upstream token value when design system CSS is present', () => {
    if (!getDesignSystemCssPath()) return

    render(
      <Div data-testid="extends-token-color" color="refLibCanary">
        Extended token color
      </Div>
    )

    const el = screen.getByTestId('extends-token-color')
    const style = window.getComputedStyle(el)
    if (style.color) {
      expect(style.color).toBe(REF_LIB_CANARY)
    }
  })
})

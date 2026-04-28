import { expect, test, type Locator } from '@playwright/test'

import { matrixTokensMarker } from '../../src/index'
import { tokensMatrixConstants } from '../../src/styles'

async function readComputedStyle(
  locator: Locator,
  properties: readonly string[],
): Promise<Record<string, string>> {
  return locator.evaluate((node: Element, requestedProperties: readonly string[]) => {
    const style = getComputedStyle(node)

    const toCamelCase = (property: string) => property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())

    return Object.fromEntries(
      requestedProperties.map((property) => {
        const camelProperty = toCamelCase(property) as keyof CSSStyleDeclaration
        const value = style[camelProperty]
        return [property, typeof value === 'string' ? value : style.getPropertyValue(property)]
      }),
    )
  }, properties)
}

function hexToRgb(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  return `rgb(${Number.parseInt(match[1], 16)}, ${Number.parseInt(match[2], 16)}, ${Number.parseInt(match[3], 16)})`
}

test.describe('tokens contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the tokens fixture root', async ({ page }) => {
    expect(matrixTokensMarker).toBe('reference-ui-matrix-tokens')
    await expect(page.getByTestId('tokens-root')).toBeVisible()
  })

  test('renders the tokens fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI tokens matrix' })).toBeVisible()
  })

  test('tokens() drives primitive text color', async ({ page }) => {
    const element = page.getByTestId('tokens-primitive')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb(tokensMatrixConstants.primaryValue))
  })

  test('tokens() drives css() text color', async ({ page }) => {
    const element = page.getByTestId('tokens-css')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb(tokensMatrixConstants.primaryValue))
  })

  test('tokens() drives css() background color', async ({ page }) => {
    const element = page.getByTestId('tokens-css')
    const computed = await readComputedStyle(element, ['background-color'])

    expect(computed['background-color']).toBe(hexToRgb(tokensMatrixConstants.mutedValue))
  })
})
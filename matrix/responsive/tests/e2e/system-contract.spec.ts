import { expect, test, type Locator } from '@playwright/test'

import { matrixResponsiveMarker } from '../../src/index'
import { responsiveViewportConstants } from '../../src/styles'

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

test.describe('responsive contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the responsive fixture root', async ({ page }) => {
    expect(matrixResponsiveMarker).toBe('reference-ui-matrix-responsive')
    await expect(page.getByTestId('responsive-root')).toBeVisible()
  })

  test('renders the responsive fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI responsive matrix' })).toBeVisible()
  })

  test('primitive r prop stays narrow below the threshold', async ({ page }) => {
    const element = page.getByTestId('responsive-primitive-target-narrow')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color'])

    expect(computed['padding-top']).toBe('0px')
    expect(computed['background-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test('primitive r prop expands above the threshold', async ({ page }) => {
    const element = page.getByTestId('responsive-primitive-target-wide')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color'])

    expect(computed['padding-top']).toBe('20px')
    expect(computed['background-color']).toBe(hexToRgb('#dbeafe'))
  })

  test('css() stays narrow below the sidebar threshold', async ({ page }) => {
    const element = page.getByTestId('responsive-css-target-narrow')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color'])

    expect(computed['padding-top']).toBe('0px')
    expect(computed['background-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test('css() matches the sidebar threshold branch', async ({ page }) => {
    const element = page.getByTestId('responsive-css-target-wide')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color', 'color'])

    expect(computed['padding-top']).toBe('12px')
    expect(computed['background-color']).toBe(hexToRgb('#2563eb'))
    expect(computed.color).toBe(hexToRgb('#ffffff'))
  })

  test('recipe() stays narrow below the card threshold', async ({ page }) => {
    const element = page.getByTestId('responsive-recipe-target-narrow')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color'])

    expect(computed['padding-top']).toBe('0px')
    expect(computed['background-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test('recipe() matches the card threshold branch', async ({ page }) => {
    const element = page.getByTestId('responsive-recipe-target-wide')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color', 'color'])

    expect(computed['padding-top']).toBe('12px')
    expect(computed['background-color']).toBe(hexToRgb('#16a34a'))
    expect(computed.color).toBe(hexToRgb('#ffffff'))
  })

  test('shared responsive trio keeps base styles below the shared container threshold', async ({ page }) => {
    const primitive = await readComputedStyle(page.getByTestId('responsive-shared-primitive-narrow'), ['padding-top', 'background-color'])
    const cssClass = await readComputedStyle(page.getByTestId('responsive-shared-css-narrow'), ['padding-top', 'background-color'])
    const recipeClass = await readComputedStyle(page.getByTestId('responsive-shared-recipe-narrow'), ['padding-top', 'background-color'])

    expect(primitive['padding-top']).toBe('0px')
    expect(primitive['background-color']).toBe('rgba(0, 0, 0, 0)')
    expect(cssClass['padding-top']).toBe('0px')
    expect(cssClass['background-color']).toBe('rgba(0, 0, 0, 0)')
    expect(recipeClass['padding-top']).toBe('0px')
    expect(recipeClass['background-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test.skip('shared responsive trio lets the breakpoint branch win above the shared container threshold', async ({ page }) => {
    const primitive = await readComputedStyle(page.getByTestId('responsive-shared-primitive-wide'), ['padding-top', 'background-color'])
    const cssClass = await readComputedStyle(page.getByTestId('responsive-shared-css-wide'), ['padding-top', 'background-color', 'color'])
    const recipeClass = await readComputedStyle(page.getByTestId('responsive-shared-recipe-wide'), ['padding-top', 'background-color', 'color'])

    expect(primitive['padding-top']).toBe(responsiveViewportConstants.sharedPrimitivePadding)
    expect(primitive['background-color']).toBe(hexToRgb(responsiveViewportConstants.sharedPrimitiveBackground))
    expect(cssClass['padding-top']).toBe(responsiveViewportConstants.sharedCssPadding)
    expect(cssClass['background-color']).toBe(hexToRgb(responsiveViewportConstants.sharedCssBackground))
    expect(cssClass.color).toBe(hexToRgb(responsiveViewportConstants.viewportForeground))
    expect(recipeClass['padding-top']).toBe(responsiveViewportConstants.sharedRecipePadding)
    expect(recipeClass['background-color']).toBe(hexToRgb(responsiveViewportConstants.sharedRecipeBackground))
    expect(recipeClass.color).toBe(hexToRgb(responsiveViewportConstants.viewportForeground))
  })
})
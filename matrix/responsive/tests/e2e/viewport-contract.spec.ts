import { expect, test, type Locator, type Page } from '@playwright/test'

import { responsiveViewportConstants } from '../../src/styles'

async function gotoAtViewport(
  page: Page,
  viewport: { width: number; height: number },
): Promise<void> {
  await page.setViewportSize(viewport)
  await page.goto('/')
}

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

test.describe('responsive viewport contract', () => {
  test('css() keeps the base branch below the viewport width threshold', async ({ page }) => {
    await gotoAtViewport(page, {
      width: responsiveViewportConstants.cssBreakpointWidth - 80,
      height: 900,
    })

    const computed = await readComputedStyle(page.getByTestId('responsive-viewport-css-target'), [
      'padding-top',
      'background-color',
    ])

    expect(computed['padding-top']).toBe('0px')
    expect(computed['background-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test('css() matches the viewport width media-query branch', async ({ page }) => {
    await gotoAtViewport(page, {
      width: responsiveViewportConstants.cssBreakpointWidth + 120,
      height: 900,
    })

    const computed = await readComputedStyle(page.getByTestId('responsive-viewport-css-target'), [
      'padding-top',
      'background-color',
      'color',
    ])

    expect(computed['padding-top']).toBe(responsiveViewportConstants.cssActivePadding)
    expect(computed['background-color']).toBe(hexToRgb(responsiveViewportConstants.cssActiveBackground))
    expect(computed.color).toBe(hexToRgb(responsiveViewportConstants.viewportForeground))
  })

  test('recipe() keeps the base branch below the viewport height threshold', async ({ page }) => {
    await gotoAtViewport(page, {
      width: 900,
      height: responsiveViewportConstants.recipeBreakpointHeight - 120,
    })

    const computed = await readComputedStyle(page.getByTestId('responsive-viewport-recipe-target'), [
      'padding-top',
      'background-color',
    ])

    expect(computed['padding-top']).toBe('0px')
    expect(computed['background-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test('recipe() matches the viewport height media-query branch', async ({ page }) => {
    await gotoAtViewport(page, {
      width: 900,
      height: responsiveViewportConstants.recipeBreakpointHeight + 120,
    })

    const computed = await readComputedStyle(page.getByTestId('responsive-viewport-recipe-target'), [
      'padding-top',
      'background-color',
      'color',
    ])

    expect(computed['padding-top']).toBe(responsiveViewportConstants.recipeActivePadding)
    expect(computed['background-color']).toBe(hexToRgb(responsiveViewportConstants.recipeActiveBackground))
    expect(computed.color).toBe(hexToRgb(responsiveViewportConstants.viewportForeground))
  })
})

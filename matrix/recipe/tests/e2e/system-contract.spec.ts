import { expect, test, type Locator, type Page } from '@playwright/test'

import { matrixRecipeMarker } from '../../src/index'
import { recipeMatrixButton, recipeMatrixConstants, recipeMatrixResponsiveCard } from '../../src/styles'

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

function normalizeColorValue(value: string): string {
  const trimmed = value.trim().toLowerCase().replace(/\s+/g, ' ')
  const oklchPercentMatch = trimmed.match(/^oklch\(([^%]+)% ([^ ]+) ([^)]+)\)$/)

  if (oklchPercentMatch) {
    return `oklch(${[oklchPercentMatch[1], oklchPercentMatch[2], oklchPercentMatch[3]].map((part, index) => {
      if (index === 0) {
        return (Number.parseFloat(part) / 100).toString()
      }

      return Number.parseFloat(part).toString()
    }).join(' ')})`
  }

  const oklchMatch = trimmed.match(/^oklch\(([^ ]+) ([^ ]+) ([^)]+)\)$/)

  if (!oklchMatch) {
    return trimmed
  }

  return `oklch(${[oklchMatch[1], oklchMatch[2], oklchMatch[3]].map((part) => Number.parseFloat(part).toString()).join(' ')})`
}

async function readCssVariable(locator: Locator, name: string): Promise<string> {
  return locator.evaluate((node: Element, variableName: string) => {
    return getComputedStyle(node).getPropertyValue(variableName).trim()
  }, name)
}

function hexToRgb(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  return `rgb(${Number.parseInt(match[1], 16)}, ${Number.parseInt(match[2], 16)}, ${Number.parseInt(match[3], 16)})`
}

async function gotoRecipeAtViewport(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 })
  await page.goto('/')
}

test.describe('recipe contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the recipe fixture root', async ({ page }) => {
    expect(matrixRecipeMarker).toBe('reference-ui-matrix-recipe')
    await expect(page.getByTestId('recipe-root')).toBeVisible()
  })

  test('renders the recipe fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI recipe matrix' })).toBeVisible()
  })

  test('recipe() returns stable classes for repeated calls', async () => {
    expect(recipeMatrixButton()).toBe(recipeMatrixButton())
    expect(recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg' })).toBe(
      recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg' }),
    )
    expect(recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg', capsule: true })).toBe(
      recipeMatrixButton({ visual: 'outline', tone: 'pink', size: 'lg', capsule: true }),
    )
    expect(recipeMatrixResponsiveCard({ tone: 'alert' })).toBe(recipeMatrixResponsiveCard({ tone: 'alert' }))
  })

  test('default recipe branch applies base border radius', async ({ page }) => {
    const element = page.getByTestId('recipe-default')
    const computed = await readComputedStyle(element, ['border-radius'])

    expect(computed['border-radius']).toBe('12px')
  })

  test('default recipe branch applies the solid background token', async ({ page }) => {
    const element = page.getByTestId('recipe-default')
    const computed = await readComputedStyle(element, ['background-color'])

    expect(computed['background-color']).toBe(hexToRgb('#2563eb'))
  })

  test('default recipe branch applies the solid text token', async ({ page }) => {
    const element = page.getByTestId('recipe-default')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb('#ffffff'))
  })

  test('default recipe branch applies the default small size font', async ({ page }) => {
    const element = page.getByTestId('recipe-default')
    const computed = await readComputedStyle(element, ['font-size'])

    expect(computed['font-size']).toBe('14px')
  })

  test('large size variant increases the font size', async ({ page }) => {
    const element = page.getByTestId('recipe-solid-large')
    const computed = await readComputedStyle(element, ['font-size'])

    expect(computed['font-size']).toBe('18px')
  })

  test('outline branch keeps the white surface', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-teal')
    const computed = await readComputedStyle(element, ['background-color'])

    expect(computed['background-color']).toBe(hexToRgb('#f8fafc'))
  })

  test('outline branch applies the neutral border token', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-teal')
    const computed = await readComputedStyle(element, ['border-top-color'])

    expect(computed['border-top-color']).toBe(hexToRgb('#94a3b8'))
  })

  test('outline branch applies the medium font weight variant', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-teal')
    const computed = await readComputedStyle(element, ['font-weight'])

    expect(computed['font-weight']).toBe('500')
  })

  test('compound variant overrides the outline branch background', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink')
    const computed = await readComputedStyle(element, ['background-color'])

    expect(computed['background-color']).toBe(hexToRgb('#fce7f3'))
  })

  test('compound variant overrides the outline branch text color', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb('#be185d'))
  })

  test('compound variant overrides the outline branch border color', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink')
    const computed = await readComputedStyle(element, ['border-top-color'])

    expect(computed['border-top-color']).toBe(hexToRgb('#ec4899'))
  })

  test('compound variant overrides the outline branch font weight', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink')
    const computed = await readComputedStyle(element, ['font-weight'])

    expect(computed['font-weight']).toBe('700')
  })

  test('boolean-style capsule branch rounds the recipe into a pill shape', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink-capsule')
    const computed = await readComputedStyle(element, ['border-radius', 'text-transform', 'letter-spacing'])

    expect(computed['border-radius']).toBe(recipeMatrixConstants.capsuleRadius)
    expect(computed['text-transform']).toBe('uppercase')
    expect(Number.parseFloat(computed['letter-spacing'])).toBeCloseTo(
      Number.parseFloat(recipeMatrixConstants.capsuleSpacing) * 18,
      2,
    )
  })

  test('cross-axis outline pink capsule branch keeps the large-size font', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink-capsule')
    const computed = await readComputedStyle(element, ['font-size'])

    expect(computed['font-size']).toBe('18px')
  })

  test('cross-axis outline pink capsule branch keeps the compound background override', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink-capsule')
    const computed = await readComputedStyle(element, ['background-color'])

    expect(computed['background-color']).toBe(hexToRgb('#fce7f3'))
  })

  test('cross-axis outline pink capsule branch keeps the compound text color override', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink-capsule')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb('#be185d'))
  })

  test('cross-axis outline pink capsule branch keeps the compound border override', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink-capsule')
    const computed = await readComputedStyle(element, ['border-top-color'])

    expect(computed['border-top-color']).toBe(hexToRgb('#ec4899'))
  })

  test('cross-axis outline pink capsule branch keeps the compound font weight override', async ({ page }) => {
    const element = page.getByTestId('recipe-outline-pink-capsule')
    const computed = await readComputedStyle(element, ['font-weight'])

    expect(computed['font-weight']).toBe('700')
  })

  test('responsive recipe base keeps its fallback branch below the viewport-width threshold', async ({ page }) => {
    await gotoRecipeAtViewport(page, recipeMatrixConstants.responsiveViewportBreakpoint - 60)

    const element = page.getByTestId('recipe-responsive-viewport-target')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color'])

    expect(computed['padding-top']).toBe('0px')
    expect(computed['background-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test('responsive recipe base matches its viewport media-query branch above the threshold', async ({ page }) => {
    await gotoRecipeAtViewport(page, recipeMatrixConstants.responsiveViewportBreakpoint + 80)

    const element = page.getByTestId('recipe-responsive-viewport-target')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color'])

    expect(computed['padding-top']).toBe(recipeMatrixConstants.responsiveViewportPadding)
    expect(computed['background-color']).toBe(hexToRgb('#1d4ed8'))
  })

  test('responsive recipe alert variant keeps its container fallback below the threshold', async ({ page }) => {
    await gotoRecipeAtViewport(page, recipeMatrixConstants.responsiveViewportBreakpoint - 60)

    const element = page.getByTestId('recipe-responsive-container-target-narrow')
    const computed = await readComputedStyle(element, ['border-top-width', 'border-top-color'])

    expect(computed['border-top-width']).toBe('0px')
    expect(computed['border-top-color']).toBe('rgba(0, 0, 0, 0)')
  })

  test('responsive recipe alert variant matches its container-query branch above the threshold', async ({ page }) => {
    await gotoRecipeAtViewport(page, recipeMatrixConstants.responsiveViewportBreakpoint - 60)

    const element = page.getByTestId('recipe-responsive-container-target-wide')
    const computed = await readComputedStyle(element, ['border-top-width', 'border-top-color'])

    expect(computed['border-top-width']).toBe(recipeMatrixConstants.responsiveContainerBorderWidth)
    expect(computed['border-top-color']).toBe(hexToRgb('#f97316'))
  })

  test('responsive recipe applies viewport media and container-query branches together on one class', async ({ page }) => {
    await gotoRecipeAtViewport(page, recipeMatrixConstants.responsiveViewportBreakpoint + 80)

    const element = page.getByTestId('recipe-responsive-container-target-wide')
    const computed = await readComputedStyle(element, ['padding-top', 'background-color', 'border-top-width', 'border-top-color'])

    expect(computed['padding-top']).toBe(recipeMatrixConstants.responsiveViewportPadding)
    expect(computed['background-color']).toBe(hexToRgb('#1d4ed8'))
    expect(computed['border-top-width']).toBe(recipeMatrixConstants.responsiveContainerBorderWidth)
    expect(computed['border-top-color']).toBe(hexToRgb('#f97316'))
  })
})
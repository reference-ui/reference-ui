import { expect, test, type Locator } from '@playwright/test'

import { matrixSpacingMarker } from '../../src/index'
import { spacingMatrixClasses } from '../../src/styles'

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

test.describe('spacing contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the spacing fixture root', async ({ page }) => {
    expect(matrixSpacingMarker).toBe('reference-ui-matrix-spacing')
    await expect(page.getByTestId('spacing-root')).toBeVisible()
  })

  test('renders the spacing fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI spacing matrix' })).toBeVisible()
  })

  test('size custom prop exports a generated utility class', async () => {
    expect(spacingMatrixClasses.sizeBox).toContain('size_')
  })

  test('padding="2r" resolves to 8px', async ({ page }) => {
    const element = page.getByTestId('spacing-rhythm-block')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('8px')
  })

  test('padding shorthand keeps the top rhythm value', async ({ page }) => {
    const element = page.getByTestId('spacing-rhythm-shorthand')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('4px')
  })

  test('padding shorthand keeps the right rhythm value', async ({ page }) => {
    const element = page.getByTestId('spacing-rhythm-shorthand')
    const computed = await readComputedStyle(element, ['padding-right'])

    expect(computed['padding-right']).toBe('8px')
  })

  test('borderRadius="1r" resolves to 4px', async ({ page }) => {
    const element = page.getByTestId('spacing-radius')
    const computed = await readComputedStyle(element, ['border-radius'])

    expect(computed['border-radius']).toBe('4px')
  })

  test('size custom prop keeps width and height equal', async ({ page }) => {
    const element = page.getByTestId('spacing-size-box')
    const computed = await readComputedStyle(element, ['width', 'height'])

    expect(computed.width).toBe('8px')
    expect(computed.height).toBe('8px')
  })
})
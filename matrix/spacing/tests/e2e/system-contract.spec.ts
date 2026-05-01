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

async function resolveBorderRadiusToken(locator: Locator, tokenName: string): Promise<string> {
  return locator.evaluate((node: Element, name: string) => {
    const probe = document.createElement('div')
    probe.style.borderRadius = `var(${name})`
    node.appendChild(probe)
    const value = getComputedStyle(probe).borderRadius
    probe.remove()
    return value
  }, tokenName)
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

  test('explicit paddingBottom overrides the shorthand bottom value', async ({ page }) => {
    const element = page.getByTestId('spacing-padding-bottom-override')
    const computed = await readComputedStyle(element, ['padding-bottom'])

    expect(computed['padding-bottom']).toBe('16px')
  })

  test('explicit paddingRight overrides the four-value shorthand right value without changing the left side', async ({ page }) => {
    const element = page.getByTestId('spacing-padding-right-override')
    const computed = await readComputedStyle(element, ['padding-right', 'padding-left'])

    expect(computed['padding-right']).toBe('20px')
    expect(computed['padding-left']).toBe('16px')
  })

  test('explicit marginLeft overrides the shorthand left value', async ({ page }) => {
    const element = page.getByTestId('spacing-margin-left-override')
    const computed = await readComputedStyle(element, ['margin-left'])

    expect(computed['margin-left']).toBe('12px')
  })

  test('explicit marginTop overrides the four-value shorthand top value without changing the bottom side', async ({ page }) => {
    const element = page.getByTestId('spacing-margin-top-override')
    const computed = await readComputedStyle(element, ['margin-top', 'margin-bottom'])

    expect(computed['margin-top']).toBe('24px')
    expect(computed['margin-bottom']).toBe('12px')
  })

  test('borderRadius="1r" resolves to 4px', async ({ page }) => {
    const element = page.getByTestId('spacing-radius')
    const computed = await readComputedStyle(element, ['border-radius'])

    expect(computed['border-radius']).toBe('4px')
  })

  test('borderRadius="2r" resolves to 8px', async ({ page }) => {
    const element = page.getByTestId('spacing-radius-2r')
    const computed = await readComputedStyle(element, ['border-radius'])

    expect(computed['border-radius']).toBe('8px')
  })

  test('borderRadius="12px" preserves literal radii in the browser', async ({ page }) => {
    const element = page.getByTestId('spacing-radius-literal')
    const computed = await readComputedStyle(element, [
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-left-radius',
      'border-bottom-right-radius',
    ])

    expect(computed['border-top-left-radius']).toBe('12px')
    expect(computed['border-top-right-radius']).toBe('12px')
    expect(computed['border-bottom-left-radius']).toBe('12px')
    expect(computed['border-bottom-right-radius']).toBe('12px')
  })

  test('borderRadius="lg" resolves through the radii token pipeline', async ({ page }) => {
    const element = page.getByTestId('spacing-radius-token')
    const computed = await readComputedStyle(element, ['border-radius'])
    const expectedRadius = await resolveBorderRadiusToken(element, '--radii-lg')

    expect(expectedRadius).not.toBe('0px')
    expect(computed['border-radius']).toBe(expectedRadius)
  })

  test('physical border radius pair shorthands resolve to both addressed corners', async ({ page }) => {
    const topPair = page.getByTestId('spacing-radius-top-pair')
    const bottomPair = page.getByTestId('spacing-radius-bottom-pair')
    const leftPair = page.getByTestId('spacing-radius-left-pair')
    const rightPair = page.getByTestId('spacing-radius-right-pair')

    const topComputed = await readComputedStyle(topPair, ['border-top-left-radius', 'border-top-right-radius'])
    const bottomComputed = await readComputedStyle(bottomPair, ['border-bottom-left-radius', 'border-bottom-right-radius'])
    const leftComputed = await readComputedStyle(leftPair, ['border-top-left-radius', 'border-bottom-left-radius'])
    const rightComputed = await readComputedStyle(rightPair, ['border-top-right-radius', 'border-bottom-right-radius'])

    expect(topComputed['border-top-left-radius']).toBe('8px')
    expect(topComputed['border-top-right-radius']).toBe('8px')
    expect(bottomComputed['border-bottom-left-radius']).toBe('8px')
    expect(bottomComputed['border-bottom-right-radius']).toBe('8px')
    expect(leftComputed['border-top-left-radius']).toBe('8px')
    expect(leftComputed['border-bottom-left-radius']).toBe('8px')
    expect(rightComputed['border-top-right-radius']).toBe('8px')
    expect(rightComputed['border-bottom-right-radius']).toBe('8px')
  })

  test('logical border radius pair shorthands resolve to the expected corners in LTR', async ({ page }) => {
    const startPair = page.getByTestId('spacing-radius-start-pair')
    const endPair = page.getByTestId('spacing-radius-end-pair')

    const startComputed = await readComputedStyle(startPair, ['border-top-left-radius', 'border-bottom-left-radius'])
    const endComputed = await readComputedStyle(endPair, ['border-top-right-radius', 'border-bottom-right-radius'])

    expect(startComputed['border-top-left-radius']).toBe('8px')
    expect(startComputed['border-bottom-left-radius']).toBe('8px')
    expect(endComputed['border-top-right-radius']).toBe('8px')
    expect(endComputed['border-bottom-right-radius']).toBe('8px')
  })

  test('size custom prop keeps width and height equal', async ({ page }) => {
    const element = page.getByTestId('spacing-size-box')
    const computed = await readComputedStyle(element, ['width', 'height'])

    expect(computed.width).toBe('8px')
    expect(computed.height).toBe('8px')
  })

  test('explicit width overrides the width side of size', async ({ page }) => {
    const element = page.getByTestId('spacing-size-width-override')
    const computed = await readComputedStyle(element, ['width', 'height'])

    expect(computed.width).toBe('12px')
    expect(computed.height).toBe('8px')
  })

  test('explicit height overrides the height side of size', async ({ page }) => {
    const element = page.getByTestId('spacing-size-height-override')
    const computed = await readComputedStyle(element, ['width', 'height'])

    expect(computed.width).toBe('8px')
    expect(computed.height).toBe('16px')
  })
})
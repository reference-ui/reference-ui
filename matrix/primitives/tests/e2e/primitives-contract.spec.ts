import { expect, test, type Locator } from '@playwright/test'
import { Div } from '@reference-ui/react'

import { primitiveMatrixColors } from '../../src/colors'
import { matrixPrimitivesMarker } from '../../src/index'

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

function parseOklchValue(value: string): [number, number, number] | null {
  const normalized = normalizeColorValue(value)
  const match = normalized.match(/^oklch\(([^ ]+) ([^ ]+) ([^)]+)\)$/)

  if (!match) {
    return null
  }

  return [Number.parseFloat(match[1]), Number.parseFloat(match[2]), Number.parseFloat(match[3])]
}

function expectColorValue(actual: string, expected: string): void {
  const actualOklch = parseOklchValue(actual)
  const expectedOklch = parseOklchValue(expected)

  if (!actualOklch || !expectedOklch) {
    expect(normalizeColorValue(actual)).toBe(normalizeColorValue(expected))
    return
  }

  expect(actualOklch[0]).toBeCloseTo(expectedOklch[0], 3)
  expect(actualOklch[1]).toBeCloseTo(expectedOklch[1], 3)
  expect(actualOklch[2]).toBeCloseTo(expectedOklch[2], 3)
}

async function readCssVariable(locator: Locator, name: string): Promise<string> {
  return locator.evaluate((node: Element, variableName: string) => {
    return getComputedStyle(node).getPropertyValue(variableName).trim()
  }, name)
}

function expectFontFamilyIncludes(fontFamily: string, fragment: string): void {
  expect(fontFamily.toLowerCase()).toContain(fragment.toLowerCase())
}

test.describe('primitives contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the primitives fixture root', async ({ page }) => {
    expect(Div).toBeTruthy()
    expect(matrixPrimitivesMarker).toBe('reference-ui-matrix-primitives')

    await expect(page.getByTestId('primitives-root')).toBeVisible()
  })

  test('renders the primitives fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI Primitives matrix' })).toBeVisible()
  })

  test('renders the primitives fixture description', async ({ page }) => {
    await expect(page.getByText('Primitive mounting and style props are exercised against emitted design-system CSS.')).toBeVisible()
  })

  test('primitive style props apply text color', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const expectedTextDanger = await readCssVariable(element, primitiveMatrixColors.textDangerCssVariable)
    const computed = await readComputedStyle(element, ['color'])

    expectColorValue(computed.color, expectedTextDanger)
  })

  test('primitive style props apply background color', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const expectedSurfaceWarning = await readCssVariable(element, primitiveMatrixColors.surfaceWarningCssVariable)
    const computed = await readComputedStyle(element, ['background-color'])

    expectColorValue(computed['background-color'], expectedSurfaceWarning)
  })

  test('primitive style props apply padding', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('16px')
  })

  test('primitive style props apply border width', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const computed = await readComputedStyle(element, ['border-width'])

    expect(computed['border-width']).toBe('2px')
  })

  test('primitive style props apply border style', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const computed = await readComputedStyle(element, ['border-style'])

    expect(computed['border-style']).toBe('solid')
  })

  test('primitive style props apply border color', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const expectedBorderStrong = await readCssVariable(element, primitiveMatrixColors.borderStrongCssVariable)
    const computed = await readComputedStyle(element, ['border-color'])

    expectColorValue(computed['border-color'], expectedBorderStrong)
  })

  test('primitive style props apply border radius', async ({ page }) => {
    const element = page.getByTestId('primitive-style-props')
    const computed = await readComputedStyle(element, ['border-radius'])

    expect(computed['border-radius']).toBe('12px')
  })

  test('inline border primitive applies border width', async ({ page }) => {
    const inlineBorder = page.getByTestId('primitive-inline-border')
    const inlineStyles = await readComputedStyle(inlineBorder, ['border-width'])

    expect(inlineStyles['border-width']).toBe('3px')
  })

  test('inline border primitive applies border style', async ({ page }) => {
    const inlineBorder = page.getByTestId('primitive-inline-border')
    const inlineStyles = await readComputedStyle(inlineBorder, ['border-style'])

    expect(inlineStyles['border-style']).toBe('solid')
  })

  test('inline border primitive applies border color', async ({ page }) => {
    const inlineBorder = page.getByTestId('primitive-inline-border')
    const expectedBorderSuccess = await readCssVariable(inlineBorder, primitiveMatrixColors.borderSuccessCssVariable)
    const inlineStyles = await readComputedStyle(inlineBorder, ['border-color'])

    expectColorValue(inlineStyles['border-color'], expectedBorderSuccess)
  })

  test('inline border primitive applies border radius', async ({ page }) => {
    const inlineBorder = page.getByTestId('primitive-inline-border')
    const inlineStyles = await readComputedStyle(inlineBorder, ['border-radius'])

    expect(inlineStyles['border-radius']).toBe('8px')
  })

  test('primitive css prop does not leak to the DOM', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    await expect(element).not.toHaveAttribute('css', /.*/)
  })

  test('primitive css prop composes a reference-ui class', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const className = await element.getAttribute('class')

    expect(className).toContain('ref-div')
  })

  test('primitive css prop does not stringify object values into class names', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const className = await element.getAttribute('class')

    expect(className).not.toContain('[object Object]')
  })

  test('primitive css prop applies relative positioning', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const computed = await readComputedStyle(element, ['position'])

    expect(computed.position).toBe('relative')
  })

  test('primitive css prop applies top offset', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const computed = await readComputedStyle(element, ['top'])

    expect(computed.top).toBe('4px')
  })

  test('primitive css prop applies left offset', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const computed = await readComputedStyle(element, ['left'])

    expect(computed.left).toBe('8px')
  })

  test('primitive css prop preserves padding', async ({ page }) => {
    const element = page.getByTestId('primitive-css-prop')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('8px')
  })

  test('font preset resolves sans font family', async ({ page }) => {
    const sansDefault = page.getByTestId('primitive-font-sans')
    const defaultStyles = await readComputedStyle(sansDefault, ['font-family'])

    expectFontFamilyIncludes(defaultStyles['font-family'], 'Inter')
  })

  test('font preset resolves regular weight', async ({ page }) => {
    const sansDefault = page.getByTestId('primitive-font-sans')
    const defaultStyles = await readComputedStyle(sansDefault, ['font-weight'])

    expect(defaultStyles['font-weight']).toBe('400')
  })

  test('font preset resolves negative letter spacing', async ({ page }) => {
    const sansDefault = page.getByTestId('primitive-font-sans')
    const defaultStyles = await readComputedStyle(sansDefault, ['letter-spacing'])

    expect(Number.parseFloat(defaultStyles['letter-spacing'])).toBeLessThan(0)
  })

  test('font preset keeps sans family under bold weight', async ({ page }) => {
    const sansBold = page.getByTestId('primitive-font-bold')
    const boldStyles = await readComputedStyle(sansBold, ['font-family'])

    expectFontFamilyIncludes(boldStyles['font-family'], 'Inter')
  })

  test('font preset resolves explicit bold weight', async ({ page }) => {
    const sansBold = page.getByTestId('primitive-font-bold')
    const boldStyles = await readComputedStyle(sansBold, ['font-weight'])

    expect(boldStyles['font-weight']).toBe('700')
  })

  test('font preset resolves token bold weight', async ({ page }) => {
    const sansBoldToken = page.getByTestId('primitive-font-token')
    const boldTokenStyles = await readComputedStyle(sansBoldToken, ['font-weight'])

    expect(boldTokenStyles['font-weight']).toBe('700')
  })

  test('anonymous container enables inline-size containment', async ({ page }) => {
    const anonymousContainer = page.getByTestId('primitive-container-anon')
    const anonymousStyles = await readComputedStyle(anonymousContainer, ['container-type'])

    expect(anonymousStyles['container-type']).toBe('inline-size')
  })

  test('named container enables inline-size containment', async ({ page }) => {
    const namedContainer = page.getByTestId('primitive-container-named')
    const namedStyles = await readComputedStyle(namedContainer, ['container-type'])

    expect(namedStyles['container-type']).toBe('inline-size')
  })

  test('named container exposes the authored container name', async ({ page }) => {
    const namedContainer = page.getByTestId('primitive-container-named')
    const namedStyles = await readComputedStyle(namedContainer, ['container-name'])

    expect(namedStyles['container-name']).toBe('sidebar')
  })

  test('responsive primitive stays narrow below the container threshold for padding', async ({ page }) => {
    const narrowResponsive = page.getByTestId('primitive-responsive-narrow')
    const narrowStyles = await readComputedStyle(narrowResponsive, ['padding-top'])

    expect(narrowStyles['padding-top']).toBe('4px')
  })

  test('responsive primitive stays narrow below the container threshold for font size', async ({ page }) => {
    const narrowResponsive = page.getByTestId('primitive-responsive-narrow')
    const narrowStyles = await readComputedStyle(narrowResponsive, ['font-size'])

    expect(narrowStyles['font-size']).toBe('16px')
  })

  test('responsive primitive expands above the container threshold for padding', async ({ page }) => {
    const wideResponsive = page.getByTestId('primitive-responsive-wide')
    const wideStyles = await readComputedStyle(wideResponsive, ['padding-top'])

    expect(wideStyles['padding-top']).toBe('16px')
  })

  test('responsive primitive expands above the container threshold for font size', async ({ page }) => {
    const wideResponsive = page.getByTestId('primitive-responsive-wide')
    const wideStyles = await readComputedStyle(wideResponsive, ['font-size'])

    expect(wideStyles['font-size']).toBe('18px')
  })

  test('size prop emits a width utility class', async ({ page }) => {
    const element = page.getByTestId('primitive-size-square')
    const className = await element.getAttribute('class')

    expect(className).toContain('w_')
  })

  test('size prop emits a height utility class', async ({ page }) => {
    const element = page.getByTestId('primitive-size-square')
    const className = await element.getAttribute('class')

    expect(className).toContain('h_')
  })

  test('size prop resolves equal rendered dimensions', async ({ page }) => {
    const element = page.getByTestId('primitive-size-square')

    const computed = await readComputedStyle(element, ['height', 'width'])

    expect(computed.width).toBeTruthy()
    expect(computed.height).toBe(computed.width)
  })

  test('combined custom props keep font family, weight, and size together below the responsive threshold', async ({ page }) => {
    const element = page.getByTestId('primitive-combined-custom-props-narrow')
    const computed = await readComputedStyle(element, ['font-family', 'font-weight', 'font-size', 'width', 'height'])

    expectFontFamilyIncludes(computed['font-family'], 'Inter')
    expect(computed['font-weight']).toBe('700')
    expect(computed['font-size']).toBe('16px')
    expect(computed.width).toBe('8px')
    expect(computed.height).toBe('8px')
  })

  test('combined custom props activate the responsive branch without losing size above the threshold', async ({ page }) => {
    const element = page.getByTestId('primitive-combined-custom-props-wide')
    const computed = await readComputedStyle(element, ['font-size', 'width', 'height'])

    expect(computed['font-size']).toBe('18px')
    expect(computed.width).toBe('8px')
    expect(computed.height).toBe('8px')
  })
})
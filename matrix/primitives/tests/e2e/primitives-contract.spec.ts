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
  test('renders the primitives fixture in a real browser', async ({ page }) => {
    expect(Div).toBeTruthy()
    expect(matrixPrimitivesMarker).toBe('reference-ui-matrix-primitives')

    await page.goto('/')

    await expect(page.getByTestId('primitives-root')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Reference UI Primitives matrix' })).toBeVisible()
    await expect(page.getByText('Primitive mounting and style props are exercised against emitted design-system CSS.')).toBeVisible()
  })

  test('applies primitive style props through emitted CSS', async ({ page }) => {
    await page.goto('/')

    const element = page.getByTestId('primitive-style-props')
    await expect(element).toBeVisible()
    const expectedTextDanger = await readCssVariable(element, primitiveMatrixColors.textDangerCssVariable)
    const expectedSurfaceWarning = await readCssVariable(element, primitiveMatrixColors.surfaceWarningCssVariable)
    const expectedBorderStrong = await readCssVariable(element, primitiveMatrixColors.borderStrongCssVariable)

    const computed = await readComputedStyle(element, [
      'background-color',
      'border-color',
      'border-radius',
      'border-style',
      'border-width',
      'color',
      'padding-top',
    ])

    expectColorValue(computed.color, expectedTextDanger)
    expectColorValue(computed['background-color'], expectedSurfaceWarning)
    expect(computed['padding-top']).toBe('16px')
    expect(computed['border-width']).toBe('2px')
    expect(computed['border-style']).toBe('solid')
    expectColorValue(computed['border-color'], expectedBorderStrong)
    expect(computed['border-radius']).toBe('12px')
  })

  test('applies inline border shorthands and radius values in computed styles', async ({ page }) => {
    await page.goto('/')

    const inlineBorder = page.getByTestId('primitive-inline-border')
    await expect(inlineBorder).toBeVisible()
    const expectedBorderSuccess = await readCssVariable(inlineBorder, primitiveMatrixColors.borderSuccessCssVariable)

    const inlineStyles = await readComputedStyle(inlineBorder, [
      'border-color',
      'border-radius',
      'border-style',
      'border-width',
    ])

    expect(inlineStyles['border-width']).toBe('3px')
    expect(inlineStyles['border-style']).toBe('solid')
    expectColorValue(inlineStyles['border-color'], expectedBorderSuccess)
    expect(inlineStyles['border-radius']).toBe('8px')
  })

  test('composes the css prop into classes instead of leaking it to the DOM', async ({ page }) => {
    await page.goto('/')

    const element = page.getByTestId('primitive-css-prop')
    await expect(element).toBeVisible()
    await expect(element).not.toHaveAttribute('css', /.*/)

    const className = await element.getAttribute('class')
    expect(className).toContain('ref-div')
    expect(className).not.toContain('[object Object]')

    const computed = await readComputedStyle(element, ['left', 'padding-top', 'position', 'top'])

    expect(computed.position).toBe('relative')
    expect(computed.top).toBe('4px')
    expect(computed.left).toBe('8px')
    expect(computed['padding-top']).toBe('8px')
  })

  test('resolves font presets, font weights, and font-level letter spacing', async ({ page }) => {
    await page.goto('/')

    const sansDefault = page.getByTestId('primitive-font-sans')
    const sansBold = page.getByTestId('primitive-font-bold')
    const sansBoldToken = page.getByTestId('primitive-font-token')
    await expect(sansDefault).toBeVisible()
    await expect(sansBold).toBeVisible()
    await expect(sansBoldToken).toBeVisible()

    const defaultStyles = await readComputedStyle(sansDefault, ['font-family', 'font-weight', 'letter-spacing'])
    const boldStyles = await readComputedStyle(sansBold, ['font-family', 'font-weight'])
    const boldTokenStyles = await readComputedStyle(sansBoldToken, ['font-weight'])

    expectFontFamilyIncludes(defaultStyles['font-family'], 'Inter')
    expect(defaultStyles['font-weight']).toBe('400')
    expect(Number.parseFloat(defaultStyles['letter-spacing'])).toBeLessThan(0)

    expectFontFamilyIncludes(boldStyles['font-family'], 'Inter')
    expect(boldStyles['font-weight']).toBe('700')
    expect(boldTokenStyles['font-weight']).toBe('700')
  })

  test('applies container semantics and container-query overrides in the browser', async ({ page }) => {
    await page.goto('/')

    const anonymousContainer = page.getByTestId('primitive-container-anon')
    const namedContainer = page.getByTestId('primitive-container-named')
    const narrowResponsive = page.getByTestId('primitive-responsive-narrow')
    const wideResponsive = page.getByTestId('primitive-responsive-wide')
    await expect(anonymousContainer).toBeVisible()
    await expect(namedContainer).toBeVisible()
    await expect(narrowResponsive).toBeVisible()
    await expect(wideResponsive).toBeVisible()

    const anonymousStyles = await readComputedStyle(anonymousContainer, ['container-type'])
    const namedStyles = await readComputedStyle(namedContainer, ['container-name', 'container-type'])
    const narrowStyles = await readComputedStyle(narrowResponsive, ['font-size', 'padding-top'])
    const wideStyles = await readComputedStyle(wideResponsive, ['font-size', 'padding-top'])

    expect(anonymousStyles['container-type']).toBe('inline-size')
    expect(namedStyles['container-type']).toBe('inline-size')
    expect(namedStyles['container-name']).toBe('sidebar')

    expect(narrowStyles['padding-top']).toBe('4px')
    expect(narrowStyles['font-size']).toBe('16px')
    expect(wideStyles['padding-top']).toBe('16px')
    expect(wideStyles['font-size']).toBe('18px')
  })

  test('expands the size prop into equal rendered dimensions', async ({ page }) => {
    await page.goto('/')

    const element = page.getByTestId('primitive-size-square')
    await expect(element).toBeVisible()

    const className = await element.getAttribute('class')
    expect(className).toContain('w_')
    expect(className).toContain('h_')

    const computed = await readComputedStyle(element, ['height', 'width'])
    expect(computed.width).toBeTruthy()
    expect(computed.height).toBe(computed.width)
  })
})
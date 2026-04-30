import { expect, test, type Locator } from '@playwright/test'

import { cssSelectorsMatrixConstants } from '../../src/constants'
import { matrixCssSelectorsMarker } from '../../src/index'

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

test.describe('css selectors contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the css-selectors fixture root', async ({ page }) => {
    expect(matrixCssSelectorsMarker).toBe('reference-ui-matrix-css-selectors')
    await expect(page.getByTestId('css-selectors-root')).toBeVisible()
  })

  test('renders the css-selectors fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI css selectors matrix' })).toBeVisible()
  })

  test('descendant selector applies margin to the nested target', async ({ page }) => {
    const computed = await readComputedStyle(page.getByTestId('css-selectors-descendant-inner'), ['margin-top'])

    expect(computed['margin-top']).toBe(cssSelectorsMatrixConstants.descendantMarginTop)
  })

  test('direct child selector applies padding to the immediate child', async ({ page }) => {
    const computed = await readComputedStyle(page.getByTestId('css-selectors-direct-child'), ['padding-left'])

    expect(computed['padding-left']).toBe(cssSelectorsMatrixConstants.directChildPaddingLeft)
  })

  test('adjacent sibling selector applies margin to the following peer', async ({ page }) => {
    const computed = await readComputedStyle(page.getByTestId('css-selectors-adjacent-peer'), ['margin-left'])

    expect(computed['margin-left']).toBe(cssSelectorsMatrixConstants.adjacentSiblingMarginLeft)
  })

  test('general sibling selector applies padding to later overlay siblings', async ({ page }) => {
    const computed = await readComputedStyle(page.getByTestId('css-selectors-general-overlay'), ['padding-top'])

    expect(computed['padding-top']).toBe(cssSelectorsMatrixConstants.generalSiblingPaddingTop)
  })

  test('hover selector changes text decoration on hover', async ({ page }) => {
    const element = page.getByTestId('css-selectors-hover-target')

    await element.hover()

    const computed = await readComputedStyle(element, ['text-decoration-line'])

    expect(computed['text-decoration-line']).toContain(cssSelectorsMatrixConstants.hoverTextDecoration)
  })

  test('focus-visible selector applies the authored outline width and style', async ({ page }) => {
    await page.keyboard.press('Tab')

    const element = page.getByTestId('css-selectors-focus-visible-target')
    await expect(element).toBeFocused()

    const computed = await readComputedStyle(element, ['outline-style', 'outline-width'])

    expect(computed['outline-style']).toBe(cssSelectorsMatrixConstants.focusVisibleOutlineStyle)
    expect(computed['outline-width']).toBe(cssSelectorsMatrixConstants.focusVisibleOutlineWidth)
  })

  test('top-level selector control resolves imported border constants', async ({ page }) => {
    const computed = await readComputedStyle(page.getByTestId('css-selectors-top-level-control'), [
      'border-top-style',
      'border-top-width',
    ])

    expect(computed['border-top-style']).toBe(cssSelectorsMatrixConstants.topLevelBorderStyle)
    expect(computed['border-top-width']).toBe(cssSelectorsMatrixConstants.topLevelBorderTopWidth)
  })

  test('self attribute selector affects matching cards but not non-matching controls', async ({ page }) => {
    const [cardStyles, panelStyles] = await Promise.all([
      readComputedStyle(page.getByTestId('css-selectors-self-attribute-card'), ['border-top-width']),
      readComputedStyle(page.getByTestId('css-selectors-self-attribute-panel'), ['border-top-width']),
    ])

    expect(cardStyles['border-top-width']).toBe(cssSelectorsMatrixConstants.selfAttributeBorderTopWidth)
    expect(panelStyles['border-top-width']).not.toBe(cssSelectorsMatrixConstants.selfAttributeBorderTopWidth)
  })

  test('self attribute hover selector affects matching cards only while hovered', async ({ page }) => {
    const card = page.getByTestId('css-selectors-self-attribute-hover-card')
    await card.hover()

    const [cardStyles, panelStyles] = await Promise.all([
      readComputedStyle(card, ['border-top-width']),
      readComputedStyle(page.getByTestId('css-selectors-self-attribute-hover-panel'), ['border-top-width']),
    ])

    expect(cardStyles['border-top-width']).toBe(cssSelectorsMatrixConstants.selfAttributeHoverBorderTopWidth)
    expect(panelStyles['border-top-width']).not.toBe(cssSelectorsMatrixConstants.selfAttributeHoverBorderTopWidth)
  })

  test('quoted and stateful self selectors resolve the matching border widths', async ({ page }) => {
    const [quotedStyles, openStyles, closedStyles] = await Promise.all([
      readComputedStyle(page.getByTestId('css-selectors-self-attribute-quoted-card'), ['border-right-width']),
      readComputedStyle(page.getByTestId('css-selectors-self-attribute-state-open'), ['border-left-width']),
      readComputedStyle(page.getByTestId('css-selectors-self-attribute-state-closed'), ['border-left-width']),
    ])

    expect(quotedStyles['border-right-width']).toBe(cssSelectorsMatrixConstants.selfAttributeQuotedBorderRightWidth)
    expect(openStyles['border-left-width']).toBe(cssSelectorsMatrixConstants.selfAttributeStateBorderLeftWidth)
    expect(closedStyles['border-left-width']).not.toBe(cssSelectorsMatrixConstants.selfAttributeStateBorderLeftWidth)
  })

  test('recipe base selectors apply descendant and direct child behavior', async ({ page }) => {
    const [rootStyles, innerStyles, childStyles] = await Promise.all([
      readComputedStyle(page.getByTestId('css-selectors-recipe-default'), ['border-top-style', 'border-top-width']),
      readComputedStyle(page.getByTestId('css-selectors-recipe-inner'), ['margin-top']),
      readComputedStyle(page.getByTestId('css-selectors-recipe-child'), ['padding-left']),
    ])

    expect(rootStyles['border-top-style']).toBe(cssSelectorsMatrixConstants.recipeBaseBorderStyle)
    expect(rootStyles['border-top-width']).toBe(cssSelectorsMatrixConstants.recipeBaseBorderTopWidth)
    expect(innerStyles['margin-top']).toBe(cssSelectorsMatrixConstants.recipeDescendantMarginTop)
    expect(childStyles['padding-left']).toBe(cssSelectorsMatrixConstants.recipeDirectChildPaddingLeft)
  })

  test('recipe variants apply hover, quoted, stateful, and compound selector results', async ({ page }) => {
    const defaultRecipe = page.getByTestId('css-selectors-recipe-default')
    await defaultRecipe.hover()

    const [defaultStyles, quietStyles, openStyles, compoundStyles] = await Promise.all([
      readComputedStyle(defaultRecipe, ['text-decoration-line']),
      readComputedStyle(page.getByTestId('css-selectors-recipe-quiet'), ['border-right-width']),
      readComputedStyle(page.getByTestId('css-selectors-recipe-state-open'), ['border-left-width']),
      readComputedStyle(page.getByTestId('css-selectors-recipe-compound'), ['border-top-width']),
    ])

    expect(defaultStyles['text-decoration-line']).toContain('overline')
    expect(quietStyles['border-right-width']).toBe(cssSelectorsMatrixConstants.recipeQuotedBorderRightWidth)
    expect(openStyles['border-left-width']).toBe(cssSelectorsMatrixConstants.recipeStateBorderLeftWidth)
    expect(compoundStyles['border-top-width']).toBe(cssSelectorsMatrixConstants.recipeCompoundBorderTopWidth)
  })
})
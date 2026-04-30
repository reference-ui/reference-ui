import { expect, test, type Locator } from '@playwright/test'

import { matrixSystemMarker } from '../../src/index'
import { systemMatrixConstants } from '../../src/system/styles'

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
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

test.describe('system contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the system fixture root', async ({ page }) => {
    expect(matrixSystemMarker).toBe('reference-ui-matrix-system')
    await expect(page.getByTestId('system-root')).toBeVisible()
  })

  test('renders the system fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI system matrix' })).toBeVisible()
  })

  test('tokens() drives primitive text color', async ({ page }) => {
    const element = page.getByTestId('system-token-text')
    const computed = await readComputedStyle(element, ['color'])

    expect(normalizeColorValue(computed.color)).toBe(normalizeColorValue(systemMatrixConstants.accentValue))
  })

  test('tokens() drives primitive background color', async ({ page }) => {
    const element = page.getByTestId('system-token-background')
    const computed = await readComputedStyle(element, ['background-color'])

    expect(normalizeColorValue(computed['background-color'])).toBe(normalizeColorValue(systemMatrixConstants.accentValue))
  })

  test('tokens() applies color-mode values across light and dark scopes', async ({ page }) => {
    const lightToken = page.getByTestId('system-token-color-mode-light')
    const darkToken = page.getByTestId('system-token-color-mode-dark')

    const lightComputed = await readComputedStyle(lightToken, ['color'])
    const darkComputed = await readComputedStyle(darkToken, ['color'])

    expect(normalizeColorValue(lightComputed.color)).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeLightValue),
    )
    expect(normalizeColorValue(darkComputed.color)).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeDarkValue),
    )
  })

  test('tokens() descendants follow the nearest explicit light or dark scope', async ({ page }) => {
    const darkToken = page.getByTestId('system-token-color-mode-dark')
    const lightIslandToken = page.getByTestId('system-token-color-mode-light-island')

    const darkComputed = await readComputedStyle(darkToken, ['color'])
    const lightIslandComputed = await readComputedStyle(lightIslandToken, ['color'])

    expect(normalizeColorValue(darkComputed.color)).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeDarkValue),
    )
    expect(normalizeColorValue(lightIslandComputed.color)).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeLightValue),
    )
  })

  test('tokens() supports an explicit light preview inside a dark host', async ({ page }) => {
    const lightPreviewToken = page.getByTestId('system-token-color-mode-light-preview')
    const lightPreviewComputed = await readComputedStyle(lightPreviewToken, ['color'])

    expect(normalizeColorValue(lightPreviewComputed.color)).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeLightValue),
    )
  })

  test('tokens() drives primitive spacing tokens beyond color families', async ({ page }) => {
    const element = page.getByTestId('system-token-spacing')
    const computed = await readComputedStyle(element, ['padding-top'])

    expect(computed['padding-top']).toBe('20px')
  })

  test('tokens() drives primitive radii tokens beyond color families', async ({ page }) => {
    const element = page.getByTestId('system-token-radius')
    const computed = await readComputedStyle(element, ['border-radius'])

    expect(computed['border-radius']).toBe('12px')
  })

  test('globalCss() emits the custom property on the document root', async ({ page }) => {
    const value = await page.locator('html').evaluate((node, variableName) => {
      return getComputedStyle(node).getPropertyValue(variableName).trim()
    }, systemMatrixConstants.globalVarName)

    expect(value).toBe(systemMatrixConstants.globalVarValue)
  })

  test('globalCss() applies body margin reset', async ({ page }) => {
    const margin = await page.locator('body').evaluate((node) => getComputedStyle(node).marginTop)

    expect(margin).toBe('0px')
  })

  test('keyframes() exposes the authored animation name', async ({ page }) => {
    const element = page.getByTestId('system-animated')
    const computed = await readComputedStyle(element, ['animation-name'])

    expect(computed['animation-name']).toContain(systemMatrixConstants.animationName)
  })

  test('global custom property is consumable from runtime style attributes', async ({ page }) => {
    const element = page.getByTestId('system-global-var-probe')
    const computed = await readComputedStyle(element, ['width'])

    expect(computed.width).toBe(systemMatrixConstants.globalVarValue)
  })

  test('css() consumes custom token families from tokens()', async ({ page }) => {
    const element = page.getByTestId('system-token-css')
    const computed = await readComputedStyle(element, [
      'color',
      'background-color',
      'padding-top',
      'border-radius',
    ])

    expect(normalizeColorValue(computed.color)).toBe(normalizeColorValue(systemMatrixConstants.accentValue))
    expect(normalizeColorValue(computed['background-color'])).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeLightValue),
    )
    expect(computed['padding-top']).toBe('20px')
    expect(computed['border-radius']).toBe('12px')
  })

  test('css() follows the nearest explicit scope for color-mode token backgrounds', async ({ page }) => {
    const darkElement = page.getByTestId('system-token-css-dark')
    const lightIslandElement = page.getByTestId('system-token-css-light-island')

    const darkComputed = await readComputedStyle(darkElement, ['background-color', 'padding-top', 'border-radius'])
    const lightIslandComputed = await readComputedStyle(lightIslandElement, [
      'background-color',
      'padding-top',
      'border-radius',
    ])

    expect(normalizeColorValue(darkComputed['background-color'])).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeDarkValue),
    )
    expect(normalizeColorValue(lightIslandComputed['background-color'])).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeLightValue),
    )
    expect(darkComputed['padding-top']).toBe('20px')
    expect(lightIslandComputed['padding-top']).toBe('20px')
    expect(darkComputed['border-radius']).toBe('12px')
    expect(lightIslandComputed['border-radius']).toBe('12px')
  })

  test('css() supports an explicit light preview inside a dark host', async ({ page }) => {
    const lightPreviewElement = page.getByTestId('system-token-css-light-preview')
    const lightPreviewComputed = await readComputedStyle(lightPreviewElement, [
      'background-color',
      'padding-top',
      'border-radius',
    ])

    expect(normalizeColorValue(lightPreviewComputed['background-color'])).toBe(
      normalizeColorValue(systemMatrixConstants.colorModeLightValue),
    )
    expect(lightPreviewComputed['padding-top']).toBe('20px')
    expect(lightPreviewComputed['border-radius']).toBe('12px')
  })

  test('globalCss(), recipe(), and primitive utilities compose with the expected layer order', async ({ page }) => {
    const element = page.getByTestId('system-layered-target')
    const computed = await readComputedStyle(element, [
      'color',
      'background-color',
      'border-top-width',
      'border-top-color',
    ])

    expect(normalizeColorValue(computed.color)).toBe(normalizeColorValue(systemMatrixConstants.accentValue))
    expect(normalizeColorValue(computed['background-color'])).toBe(
      normalizeColorValue(systemMatrixConstants.layeredRecipeBackground),
    )
    expect(computed['border-top-width']).toBe('4px')
    expect(normalizeColorValue(computed['border-top-color'])).toBe(
      normalizeColorValue(systemMatrixConstants.layeredGlobalBorderColor),
    )
  })

  test('mounted stylesheet contains the layer ordering declaration', async ({ page }) => {
    const hasLayerOrder = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        return (element.textContent ?? '').includes('@layer reset, global, base, tokens, recipes, utilities;')
      })
    })

    expect(hasLayerOrder).toBe(true)
  })

  test('mounted stylesheet contains the system layer block', async ({ page }) => {
    const hasLayerBlock = await page.evaluate((layerName) => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        return (element.textContent ?? '').includes(`@layer ${layerName} {`)
      })
    }, systemMatrixConstants.layerName)

    expect(hasLayerBlock).toBe(true)
  })

  test('mounted stylesheet contains the globalCss custom property name', async ({ page }) => {
    const hasGlobalVar = await page.evaluate((globalVarName) => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        return (element.textContent ?? '').includes(globalVarName)
      })
    }, systemMatrixConstants.globalVarName)

    expect(hasGlobalVar).toBe(true)
  })

  test('mounted stylesheet contains the color-mode token variable name', async ({ page }) => {
    const hasColorModeToken = await page.evaluate((colorModeToken) => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        return (element.textContent ?? '').includes(`--colors-${colorModeToken.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`)
      })
    }, systemMatrixConstants.colorModeToken)

    expect(hasColorModeToken).toBe(true)
  })

  test('mounted stylesheet contains a dark-scope branch for the color-mode token', async ({ page }) => {
    const hasDarkColorModeBranch = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        const text = element.textContent ?? ''
        return text.includes('data-panda-theme=dark') && text.includes('--colors-system-matrix-color-mode-token')
      })
    })

    expect(hasDarkColorModeBranch).toBe(true)
  })

  test('mounted stylesheet contains the authored keyframes name', async ({ page }) => {
    const hasKeyframes = await page.evaluate((animationName) => {
      return Array.from(document.querySelectorAll('style')).some((element) => {
        return (element.textContent ?? '').includes(`@keyframes ${animationName}`)
      })
    }, systemMatrixConstants.animationName)

    expect(hasKeyframes).toBe(true)
  })
})
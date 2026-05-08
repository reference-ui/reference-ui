import { expect, test, type Locator } from '@playwright/test'

import { matrixColorModeMarker } from '../../src/index'
import { colorModeMatrixConstants } from '../../src/styles'

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

test.describe('color-mode contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the color-mode fixture root', async ({ page }) => {
    expect(matrixColorModeMarker).toBe('reference-ui-matrix-color-mode')
    await expect(page.getByTestId('color-mode-root')).toBeVisible()
  })

  test('renders the color-mode fixture heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reference UI color-mode matrix' })).toBeVisible()
  })

  test('no explicit color-mode override resolves light-mode tokens by default', async ({ page }) => {
    const element = page.getByTestId('color-mode-default-token')
    const computed = await readComputedStyle(element, ['color'])

    expect(computed.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))
  })

  test('nested dark colorMode creates a dark island inside a light scope', async ({ page }) => {
    const outer = page.getByTestId('color-mode-outer-light')
    const inner = page.getByTestId('color-mode-inner-dark')
    const outerColor = await readComputedStyle(outer, ['color'])
    const innerColor = await readComputedStyle(inner, ['color'])

    expect(outerColor.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))
    expect(innerColor.color).toBe(hexToRgb(colorModeMatrixConstants.darkValue))
  })

  test('explicit light preview escapes the surrounding dark scope', async ({ page }) => {
    const darkPreview = page.getByTestId('color-mode-preview-dark')
    const lightPreview = page.getByTestId('color-mode-preview-light')
    const darkPreviewColor = await readComputedStyle(darkPreview, ['color'])
    const lightPreviewColor = await readComputedStyle(lightPreview, ['color'])

    expect(darkPreviewColor.color).toBe(hexToRgb(colorModeMatrixConstants.darkValue))
    expect(lightPreviewColor.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))
  })

  test('dark island overrides the surrounding light host', async ({ page }) => {
    const lightHost = page.getByTestId('color-mode-light-host-token')
    const darkIsland = page.getByTestId('color-mode-dark-island-token')
    const lightHostColor = await readComputedStyle(lightHost, ['color'])
    const darkIslandColor = await readComputedStyle(darkIsland, ['color'])

    expect(lightHostColor.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))
    expect(darkIslandColor.color).toBe(hexToRgb(colorModeMatrixConstants.darkValue))
  })

  test('descendants follow the nearest explicit light or dark scope', async ({ page }) => {
    const lightChild = page.getByTestId('color-mode-cascade-light-child')
    const darkChild = page.getByTestId('color-mode-cascade-dark-child')
    const lightChildColor = await readComputedStyle(lightChild, ['color'])
    const darkChildColor = await readComputedStyle(darkChild, ['color'])

    expect(lightChildColor.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))
    expect(darkChildColor.color).toBe(hexToRgb(colorModeMatrixConstants.darkValue))
  })

  test('toggling the root theme updates descendant token resolution', async ({ page }) => {
    const rootToken = page.getByTestId('color-mode-live-root-token')
    const toggle = page.getByTestId('color-mode-toggle-root-theme')

    const initial = await readComputedStyle(rootToken, ['color'])
    expect(initial.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))

    await toggle.click()

    await expect
      .poll(async () => {
        const toggled = await readComputedStyle(rootToken, ['color'])
        return toggled.color
      })
      .toBe(hexToRgb(colorModeMatrixConstants.darkValue))
  })

  test('toggling a nested colorMode updates the nearest nested scope without changing the light host', async ({ page }) => {
    const hostToken = page.getByTestId('color-mode-live-nested-host-token')
    const nestedToken = page.getByTestId('color-mode-live-nested-token')
    const toggle = page.getByTestId('color-mode-toggle-nested-theme')

    const initialHost = await readComputedStyle(hostToken, ['color'])
    const initialNested = await readComputedStyle(nestedToken, ['color'])

    expect(initialHost.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))
    expect(initialNested.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))

    await toggle.click()

    await expect
      .poll(async () => {
        const toggledHost = await readComputedStyle(hostToken, ['color'])
        return toggledHost.color
      })
      .toBe(hexToRgb(colorModeMatrixConstants.lightValue))

    await expect
      .poll(async () => {
        const toggledNested = await readComputedStyle(nestedToken, ['color'])
        return toggledNested.color
      })
      .toBe(hexToRgb(colorModeMatrixConstants.darkValue))
  })

  test('multiple theme islands update in the same session while each descendant follows its nearest scope', async ({ page }) => {
    const hostToken = page.getByTestId('color-mode-live-multi-host-token')
    const leftToken = page.getByTestId('color-mode-live-multi-left-token')
    const rightToken = page.getByTestId('color-mode-live-multi-right-token')
    const swap = page.getByTestId('color-mode-swap-multi-islands')

    const initialHost = await readComputedStyle(hostToken, ['color'])
    const initialLeft = await readComputedStyle(leftToken, ['color'])
    const initialRight = await readComputedStyle(rightToken, ['color'])

    expect(initialHost.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))
    expect(initialLeft.color).toBe(hexToRgb(colorModeMatrixConstants.lightValue))
    expect(initialRight.color).toBe(hexToRgb(colorModeMatrixConstants.darkValue))

    await swap.click()

    await expect
      .poll(async () => {
        const toggledHost = await readComputedStyle(hostToken, ['color'])
        return toggledHost.color
      })
      .toBe(hexToRgb(colorModeMatrixConstants.lightValue))

    await expect
      .poll(async () => {
        const toggledLeft = await readComputedStyle(leftToken, ['color'])
        return toggledLeft.color
      })
      .toBe(hexToRgb(colorModeMatrixConstants.darkValue))

    await expect
      .poll(async () => {
        const toggledRight = await readComputedStyle(rightToken, ['color'])
        return toggledRight.color
      })
      .toBe(hexToRgb(colorModeMatrixConstants.lightValue))
  })
})
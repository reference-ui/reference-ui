import { test, expect } from '@playwright/test'
import { tokensConfig } from '../../environments/base/tokens-config'
import { testRoutes } from '../../environments/base/routes'

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

test.describe('color mode', () => {
  test('ColorModeTest mounts', async ({ page }) => {
    await page.goto(testRoutes.colorMode)
    const root = page.getByTestId('color-mode-test')
    await expect(root).toBeVisible()
  })

  test('nested dark colorMode creates a dark island inside a light scope', async ({ page }) => {
    await page.goto(testRoutes.colorMode)
    const outer = page.getByTestId('tokens-mode-outer-light')
    const inner = page.getByTestId('tokens-mode-inner-dark')
    await expect(outer).toBeVisible()
    await expect(inner).toBeVisible()

    const outerColor = await outer.evaluate((e) => getComputedStyle(e).color)
    const innerColor = await inner.evaluate((e) => getComputedStyle(e).color)

    expect(outerColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.value))
    expect(innerColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.dark))
  })

  test('explicit light preview creates a light island inside a dark scope', async ({ page }) => {
    await page.goto(testRoutes.colorMode)
    const darkPreview = page.getByTestId('tokens-docs-preview-dark')
    const lightPreview = page.getByTestId('tokens-docs-preview-light')
    await expect(darkPreview).toBeVisible()
    await expect(lightPreview).toBeVisible()

    const darkPreviewColor = await darkPreview.evaluate((e) => getComputedStyle(e).color)
    const lightPreviewColor = await lightPreview.evaluate((e) => getComputedStyle(e).color)

    expect(darkPreviewColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.dark))
    expect(lightPreviewColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.value))
  })

  test('dark preview creates a dark island inside a light scope', async ({ page }) => {
    await page.goto(testRoutes.colorMode)
    const lightHost = page.getByTestId('tokens-docs-light-host-token')
    const darkIsland = page.getByTestId('tokens-docs-dark-island-token')
    await expect(lightHost).toBeVisible()
    await expect(darkIsland).toBeVisible()

    const lightHostColor = await lightHost.evaluate((e) => getComputedStyle(e).color)
    const darkIslandColor = await darkIsland.evaluate((e) => getComputedStyle(e).color)

    expect(lightHostColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.value))
    expect(darkIslandColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.dark))
  })

  test('descendants follow the nearest explicit light or dark scope', async ({ page }) => {
    await page.goto(testRoutes.colorMode)
    const lightChild = page.getByTestId('tokens-cascade-light-child')
    const darkChild = page.getByTestId('tokens-cascade-dark-child')
    await expect(lightChild).toBeVisible()
    await expect(darkChild).toBeVisible()

    const lightChildColor = await lightChild.evaluate((e) => getComputedStyle(e).color)
    const darkChildColor = await darkChild.evaluate((e) => getComputedStyle(e).color)

    expect(lightChildColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.value))
    expect(darkChildColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.dark))
  })
})

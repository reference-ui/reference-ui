import { test, expect } from '@playwright/test'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { getSandboxDir } from '../../environments/lib/config.js'
import { testRoutes } from '../../environments/base/routes.js'

const { tokensConfig } = await import(
  pathToFileURL(join(getSandboxDir(), 'tokens.ts')).href
)

/** Hex to rgb string for comparing with getComputedStyle */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

test.describe('tokens', () => {
  test('TokensTest mounts', async ({ page }) => {
    await page.goto(testRoutes.tokens)
    const root = page.getByTestId('tokens-test')
    await expect(root).toBeVisible()
  })

  test('tokens() - primitive uses custom color from config', async ({ page }) => {
    await page.goto(testRoutes.tokens)
    const el = page.getByTestId('tokens-primitive')
    await expect(el).toBeVisible()
    const color = await el.evaluate((e) => getComputedStyle(e).color)
    const expected = hexToRgb(tokensConfig.colors.test.primary.value)
    expect(color).toBe(expected)
  })

  test('tokens() - css() resolves custom color and bg from config', async ({ page }) => {
    await page.goto(testRoutes.tokens)
    const el = page.getByTestId('tokens-css')
    await expect(el).toBeVisible()
    const color = await el.evaluate((e) => getComputedStyle(e).color)
    const bg = await el.evaluate((e) => getComputedStyle(e).backgroundColor)
    expect(color).toBe(hexToRgb(tokensConfig.colors.test.primary.value))
    expect(bg).toBe(hexToRgb(tokensConfig.colors.test.muted.value))
  })

  test('tokens() - nested dark colorMode creates a dark island inside a light scope', async ({
    page,
  }) => {
    await page.goto(testRoutes.tokens)
    const outer = page.getByTestId('tokens-mode-outer-light')
    const inner = page.getByTestId('tokens-mode-inner-dark')
    await expect(outer).toBeVisible()
    await expect(inner).toBeVisible()

    const outerColor = await outer.evaluate((e) => getComputedStyle(e).color)
    const innerColor = await inner.evaluate((e) => getComputedStyle(e).color)

    expect(outerColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.value))
    expect(innerColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.dark))
  })

  test('tokens() - docs-style light preview should create a light island inside a dark scope', async ({
    page,
  }) => {
    await page.goto(testRoutes.tokens)
    const darkPreview = page.getByTestId('tokens-docs-preview-dark')
    const lightPreview = page.getByTestId('tokens-docs-preview-light')
    await expect(darkPreview).toBeVisible()
    await expect(lightPreview).toBeVisible()

    const darkPreviewColor = await darkPreview.evaluate((e) => getComputedStyle(e).color)
    const lightPreviewColor = await lightPreview.evaluate((e) => getComputedStyle(e).color)

    expect(darkPreviewColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.dark))
    expect(lightPreviewColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.value))
  })

  test('tokens() - docs-style dark preview should create a dark island inside a light scope', async ({
    page,
  }) => {
    await page.goto(testRoutes.tokens)
    const lightHost = page.getByTestId('tokens-docs-light-host-token')
    const darkIsland = page.getByTestId('tokens-docs-dark-island-token')
    await expect(lightHost).toBeVisible()
    await expect(darkIsland).toBeVisible()

    const lightHostColor = await lightHost.evaluate((e) => getComputedStyle(e).color)
    const darkIslandColor = await darkIsland.evaluate((e) => getComputedStyle(e).color)

    expect(lightHostColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.value))
    expect(darkIslandColor).toBe(hexToRgb(tokensConfig.colors.test.colorMode.dark))
  })
})

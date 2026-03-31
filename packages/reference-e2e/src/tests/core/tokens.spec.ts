import { test, expect } from '@playwright/test'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { getSandboxDir } from '../../environments/lib/config'
import { testRoutes } from '../../environments/base/routes'

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
})

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

/** getComputedStyle normalizes rem to px (at 16px root). Normalize token value for comparison. */
function computedEquivalent(value: string): string {
  const rem = /^([\d.]+)rem$/.exec(value)
  if (rem) return `${Number.parseFloat(rem[1]) * 16}px`
  return value
}

test.describe('style-props', () => {
  test('StylePropsTest mounts', async ({ page }) => {
    await page.goto(testRoutes.styleProps)
    const root = page.getByTestId('style-props-test')
    await expect(root).toBeVisible()
  })

  test('Div renders custom tokens: color, bg, padding, radii, border', async ({
    page,
  }) => {
    await page.goto(testRoutes.styleProps)
    const el = page.getByTestId('style-props-tokens')
    await expect(el).toBeVisible()

    const color = await el.evaluate((e) => getComputedStyle(e).color)
    const bg = await el.evaluate((e) => getComputedStyle(e).backgroundColor)
    const padding = await el.evaluate((e) => getComputedStyle(e).paddingTop)
    const borderRadius = await el.evaluate((e) => getComputedStyle(e).borderRadius)
    const borderWidth = await el.evaluate((e) => getComputedStyle(e).borderWidth)
    const borderColor = await el.evaluate((e) => getComputedStyle(e).borderColor)

    expect(color).toBe(hexToRgb(tokensConfig.colors.test.primary.value))
    expect(bg).toBe(hexToRgb(tokensConfig.colors.test.muted.value))
    expect(padding).toBe(computedEquivalent(tokensConfig.spacing['test-md'].value))
    expect(borderRadius).toBe(computedEquivalent(tokensConfig.radii['test-round'].value))
    expect(borderWidth).toBe(tokensConfig.borderWidths['test-1'].value)
    expect(borderColor).toBe(hexToRgb(tokensConfig.colors.test.primary.value))
  })

  test('Div renders inline colors (hex on the fly)', async ({ page }) => {
    await page.goto(testRoutes.styleProps)
    const el = page.getByTestId('style-props-inline-color')
    await expect(el).toBeVisible()

    const color = await el.evaluate((e) => getComputedStyle(e).color)
    const bg = await el.evaluate((e) => getComputedStyle(e).backgroundColor)

    expect(color).toBe(hexToRgb('#dc2626'))
    expect(bg).toBe(hexToRgb('#fef3c7'))
  })

  test('Div renders inline border 1px solid #123', async ({ page }) => {
    await page.goto(testRoutes.styleProps)
    const el = page.getByTestId('style-props-border-shorthand-hex')
    await expect(el).toBeVisible()

    const borderWidth = await el.evaluate((e) => getComputedStyle(e).borderWidth)
    const borderStyle = await el.evaluate((e) => getComputedStyle(e).borderStyle)
    const borderColor = await el.evaluate((e) => getComputedStyle(e).borderColor)

    expect(borderWidth).toBe('1px')
    expect(borderStyle).toBe('solid')
    expect(borderColor).toBe(hexToRgb('#112233')) // #123 → #112233
  })

  test('Div renders inline border shorthand and radius', async ({ page }) => {
    await page.goto(testRoutes.styleProps)
    const el = page.getByTestId('style-props-inline-border')
    await expect(el).toBeVisible()

    const borderWidth = await el.evaluate((e) => getComputedStyle(e).borderWidth)
    const borderStyle = await el.evaluate((e) => getComputedStyle(e).borderStyle)
    const borderColor = await el.evaluate((e) => getComputedStyle(e).borderColor)
    const borderRadius = await el.evaluate((e) => getComputedStyle(e).borderRadius)

    expect(borderWidth).toBe('3px')
    expect(borderStyle).toBe('solid')
    expect(borderColor).toBe(hexToRgb('#16a34a'))
    expect(borderRadius).toBe('8px')
  })

  test('Div renders mixed tokens and inline values', async ({ page }) => {
    await page.goto(testRoutes.styleProps)
    const el = page.getByTestId('style-props-mixed')
    await expect(el).toBeVisible()

    const borderRadius = await el.evaluate((e) => getComputedStyle(e).borderRadius)
    const borderWidth = await el.evaluate((e) => getComputedStyle(e).borderWidth)
    const borderColor = await el.evaluate((e) => getComputedStyle(e).borderColor)
    const padding = await el.evaluate((e) => getComputedStyle(e).paddingTop)

    expect(borderRadius).toBe(computedEquivalent(tokensConfig.radii['test-round'].value))
    expect(borderWidth).toBe('2px')
    expect(borderColor).toBe(hexToRgb('#7c3aed'))
    expect(padding).toBe(computedEquivalent(tokensConfig.spacing['test-sm'].value))
  })
})

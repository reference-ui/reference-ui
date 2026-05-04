import { test, expect } from '@playwright/test'
import { tokensConfig } from '../../environments/base/tokens-config'
import { testRoutes } from '../../environments/base/routes'

/** Hex to rgb string for comparing with getComputedStyle */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return ''
  return `rgb(${Number.parseInt(result[1], 16)}, ${Number.parseInt(result[2], 16)}, ${Number.parseInt(result[3], 16)})`
}

test.describe('tokens', () => {
  // MIGRATED: Covered by matrix/tokens/tests/e2e/system-contract.spec.ts.
  test('TokensTest mounts', async ({ page }) => {
    await page.goto(testRoutes.tokens)
    const root = page.getByTestId('tokens-test')
    await expect(root).toBeVisible()
  })

  // MIGRATED: Covered by matrix/tokens/tests/e2e/system-contract.spec.ts.
  test('tokens() - primitive uses custom color from config', async ({ page }) => {
    await page.goto(testRoutes.tokens)
    const el = page.getByTestId('tokens-primitive')
    await expect(el).toBeVisible()
    const expected = hexToRgb(tokensConfig.colors.test.primary.value)

    await expect
      .poll(() => el.evaluate((e) => getComputedStyle(e).color))
      .toBe(expected)
  })

  // MIGRATED: Covered by matrix/tokens/tests/e2e/system-contract.spec.ts.
  test('tokens() - css() resolves custom color and bg from config', async ({ page }) => {
    await page.goto(testRoutes.tokens)
    const el = page.getByTestId('tokens-css')
    await expect(el).toBeVisible()

    await expect
      .poll(() =>
        el.evaluate((e) => ({
          color: getComputedStyle(e).color,
          bg: getComputedStyle(e).backgroundColor,
        }))
      )
      .toEqual({
        color: hexToRgb(tokensConfig.colors.test.primary.value),
        bg: hexToRgb(tokensConfig.colors.test.muted.value),
      })
  })
})

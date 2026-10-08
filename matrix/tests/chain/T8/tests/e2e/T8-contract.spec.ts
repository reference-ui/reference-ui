import { expect, test } from '@playwright/test'

const fixtureDemoBgRgb = 'rgb(15, 23, 42)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'

test.describe('T8 — same library in both extends and layers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t8 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t8-root')).toBeVisible()
  })

  test('upstream DemoComponent renders correctly even when duplicated', async ({ page }) => {
    await expect(page.getByTestId('fixture-demo')).toBeVisible()
    const bg = await page.getByTestId('fixture-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(fixtureDemoBgRgb)
  })

  test('upstream accent token resolves on the eyebrow (extends-side adoption)', async ({ page }) => {
    const color = await page.getByTestId('fixture-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(color.trim()).toBe(fixtureDemoAccentRgb)
  })

  // Documenting the current allow-and-duplicate policy at the assembled-CSS
  // level. If/when reference-core moves to dedupe, update this assertion.
  test('upstream layer block appears at least once in the assembled stylesheet', async ({ page }) => {
    const cssBlocks = await page.evaluate(() => {
      return Array.from(document.styleSheets).flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText)
        } catch {
          return []
        }
      })
    })
    const matches = cssBlocks.filter(text => text.includes('@layer extend-library'))
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})

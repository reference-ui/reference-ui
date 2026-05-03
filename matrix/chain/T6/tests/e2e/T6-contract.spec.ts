import { expect, test } from '@playwright/test'

const metaExtendBgRgb = 'rgb(49, 46, 129)'
const metaExtendTextRgb = 'rgb(224, 231, 255)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'

test.describe('T6 — chain (app extends only the outer library)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t6 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t6-root')).toBeVisible()
  })

  test('MetaExtendDemo is visible', async ({ page }) => {
    await expect(page.getByTestId('meta-extend-demo')).toBeVisible()
  })

  test('local meta-extend token resolves on the demo background', async ({ page }) => {
    const bg = await page.getByTestId('meta-extend-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaExtendBgRgb)
  })

  test('local meta-extend token resolves on the demo copy color', async ({ page }) => {
    const color = await page.getByTestId('meta-extend-demo-copy').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(color.trim()).toBe(metaExtendTextRgb)
  })

  test('transitive extend-library token resolves on the demo eyebrow', async ({ page }) => {
    const color = await page.getByTestId('meta-extend-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(color.trim()).toBe(fixtureDemoAccentRgb)
  })
})

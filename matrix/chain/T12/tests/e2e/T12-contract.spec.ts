import { expect, test } from '@playwright/test'

const metaExtendBgRgb = 'rgb(49, 46, 129)'
const metaSiblingBgRgb = 'rgb(124, 45, 18)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'

test.describe('T12 — diamond base, mixed branch composition', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t12 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t12-root')).toBeVisible()
  })

  test('extend-side branch (sibling) contributes both local and shared-base tokens', async ({ page }) => {
    await expect(page.getByTestId('meta-sibling-demo')).toBeVisible()

    const bg = await page.getByTestId('meta-sibling-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaSiblingBgRgb)

    const eyebrow = await page.getByTestId('meta-sibling-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(eyebrow.trim()).toBe(fixtureDemoAccentRgb)
  })

  test('layer-side branch component still renders inside its own scope', async ({ page }) => {
    await expect(page.getByTestId('meta-extend-demo')).toBeVisible()

    const bg = await page.getByTestId('meta-extend-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaExtendBgRgb)
  })
})

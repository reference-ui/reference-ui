import { expect, test } from '@playwright/test'

const metaExtendBgRgb = 'rgb(49, 46, 129)'
const metaExtend2BgRgb = 'rgb(54, 83, 20)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'
const secondaryDemoAccentRgb = 'rgb(52, 211, 153)'

test.describe('T16 — parallel chains', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t16 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t16-root')).toBeVisible()
  })

  test('chain 1 endpoint and shared base both contribute', async ({ page }) => {
    await expect(page.getByTestId('meta-extend-demo')).toBeVisible()

    const bg = await page.getByTestId('meta-extend-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaExtendBgRgb)

    const eyebrow = await page.getByTestId('meta-extend-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(eyebrow.trim()).toBe(fixtureDemoAccentRgb)
  })

  test('chain 2 endpoint and shared base both contribute', async ({ page }) => {
    await expect(page.getByTestId('meta-extend-2-demo')).toBeVisible()

    const bg = await page.getByTestId('meta-extend-2-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaExtend2BgRgb)

    const eyebrow = await page.getByTestId('meta-extend-2-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(eyebrow.trim()).toBe(secondaryDemoAccentRgb)
  })
})

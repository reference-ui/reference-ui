import { expect, test } from '@playwright/test'

const metaExtendBgRgb = 'rgb(49, 46, 129)'
const metaExtend2BgRgb = 'rgb(54, 83, 20)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'
const secondaryDemoAccentRgb = 'rgb(52, 211, 153)'
const layerPrivateAccentRgb = 'rgb(99, 102, 241)'

test.describe('T18 — parallel chains + shared layer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t18 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t18-root')).toBeVisible()
  })

  test('chain 1 contributes its local + transitive tokens', async ({ page }) => {
    const bg = await page.getByTestId('meta-extend-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaExtendBgRgb)

    const eyebrow = await page.getByTestId('meta-extend-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(eyebrow.trim()).toBe(fixtureDemoAccentRgb)
  })

  test('chain 2 contributes its local + transitive tokens', async ({ page }) => {
    const bg = await page.getByTestId('meta-extend-2-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaExtend2BgRgb)

    const eyebrow = await page.getByTestId('meta-extend-2-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(eyebrow.trim()).toBe(secondaryDemoAccentRgb)
  })

  test('layered library renders inside its own scope', async ({ page }) => {
    const bg = await page.getByTestId('layer-private-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(layerPrivateAccentRgb)
  })
})

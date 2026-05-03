import { expect, test } from '@playwright/test'

const metaExtendBgRgb = 'rgb(49, 46, 129)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'
const layerPrivateAccentRgb = 'rgb(99, 102, 241)'

test.describe('T12 — chain + layer at the app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t12 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t12-root')).toBeVisible()
  })

  test('extend-chain MetaExtendDemo resolves both local and transitive tokens', async ({ page }) => {
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

  test('layered LayerPrivateDemo resolves only inside its own layer scope', async ({ page }) => {
    const bg = await page.getByTestId('layer-private-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(layerPrivateAccentRgb)
  })
})

import { expect, test } from '@playwright/test'

const metaExtendBgRgb = 'rgb(49, 46, 129)'
const metaSiblingBgRgb = 'rgb(124, 45, 18)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'

test.describe('T7 — diamond composition', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t7 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t7-root')).toBeVisible()
  })

  test('both diamond branches render their components', async ({ page }) => {
    await expect(page.getByTestId('meta-extend-demo')).toBeVisible()
    await expect(page.getByTestId('meta-sibling-demo')).toBeVisible()
  })

  test('left branch local token resolves', async ({ page }) => {
    const bg = await page.getByTestId('meta-extend-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaExtendBgRgb)
  })

  test('right branch local token resolves', async ({ page }) => {
    const bg = await page.getByTestId('meta-sibling-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(metaSiblingBgRgb)
  })

  test('shared base token resolves on both branch eyebrows', async ({ page }) => {
    const left = await page.getByTestId('meta-extend-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    const right = await page.getByTestId('meta-sibling-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(left.trim()).toBe(fixtureDemoAccentRgb)
    expect(right.trim()).toBe(fixtureDemoAccentRgb)
  })
})

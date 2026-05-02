import { expect, test } from '@playwright/test'

const fixtureDemoBgRgb = 'rgb(15, 23, 42)'
const fixtureDemoTextRgb = 'rgb(248, 250, 252)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'

test.describe('T1 — extend one library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t1 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t1-root')).toBeVisible()
  })

  test('upstream extend-library DemoComponent is visible', async ({ page }) => {
    await expect(page.getByTestId('fixture-demo')).toBeVisible()
  })

  test('DemoComponent background resolves from upstream fixtureDemoBg token', async ({ page }) => {
    const bg = await page.getByTestId('fixture-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(fixtureDemoBgRgb)
  })

  test('DemoComponent eyebrow resolves from upstream fixtureDemoAccent token', async ({ page }) => {
    const color = await page.getByTestId('fixture-demo-eyebrow').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(color.trim()).toBe(fixtureDemoAccentRgb)
  })

  test('DemoComponent copy resolves from upstream fixtureDemoText token', async ({ page }) => {
    const color = await page.getByTestId('fixture-demo-copy').evaluate(
      el => getComputedStyle(el).getPropertyValue('color'),
    )
    expect(color.trim()).toBe(fixtureDemoTextRgb)
  })
})

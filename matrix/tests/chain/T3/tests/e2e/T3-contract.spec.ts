/**
 * Chain T3 browser contract. Renders the chain-t3 root in Playwright and proves
 * both sides of the hybrid boundary: the extend-side DemoComponent resolves all
 * three adopted upstream tokens, and the layer-side LayerPrivateDemo resolves
 * its layer-scoped background. The end-to-end proof of the T3 topology declared
 * in `../../ui.config.ts`.
 */

import { expect, test } from '@playwright/test'

const fixtureDemoBgRgb = 'rgb(15, 23, 42)'
const fixtureDemoAccentRgb = 'rgb(20, 184, 166)'
const fixtureDemoTextRgb = 'rgb(248, 250, 252)'
const layerPrivateAccentRgb = 'rgb(99, 102, 241)'

test.describe('T3 — extend one library + layer another', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t3 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t3-root')).toBeVisible()
  })

  // --- extend side: extend-library tokens must be adopted ---

  test('DemoComponent (extend side) is visible', async ({ page }) => {
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

  // --- layer side: layer-library CSS arrives but token is scoped to its layer ---

  test('LayerPrivateDemo (layer side) is visible', async ({ page }) => {
    await expect(page.getByTestId('layer-private-demo')).toBeVisible()
  })

  test('LayerPrivateDemo background resolves from the layer-scoped token', async ({ page }) => {
    const bg = await page.getByTestId('layer-private-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(layerPrivateAccentRgb)
  })
})

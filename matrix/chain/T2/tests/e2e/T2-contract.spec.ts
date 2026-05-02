import { expect, test } from '@playwright/test'

const layerPrivateAccentRgb = 'rgb(99, 102, 241)'

test.describe('T2 — layer one library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the chain-t2 root', async ({ page }) => {
    await expect(page.getByTestId('chain-t2-root')).toBeVisible()
  })

  test('LayerPrivateDemo component is visible', async ({ page }) => {
    await expect(page.getByTestId('layer-private-demo')).toBeVisible()
  })

  test('LayerPrivateDemo background resolves from the layer-scoped token', async ({ page }) => {
    // The layerPrivateAccent token is NOT in chain-t2's global namespace —
    // only the component that lives inside the same CSS layer can resolve it.
    const bg = await page.getByTestId('layer-private-demo').evaluate(
      el => getComputedStyle(el).getPropertyValue('background-color'),
    )
    expect(bg.trim()).toBe(layerPrivateAccentRgb)
  })
})

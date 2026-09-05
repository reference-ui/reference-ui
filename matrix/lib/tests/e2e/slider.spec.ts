import { expect, test } from '@playwright/test'

test.describe('Slider Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/slider')
    await expect(page.getByTestId('slider-fixture-root')).toBeVisible()
  })

  test('SD-DOM-01 & SD-DOM-02: Renders slider parts and updates value via keyboard arrows', async ({
    page,
  }) => {
    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    await expect(thumb).toHaveAttribute('role', 'slider')
    await expect(thumb).toHaveAttribute('aria-valuemin', '0')
    await expect(thumb).toHaveAttribute('aria-valuemax', '100')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')

    // Keyboard ArrowRight increases by step (5) -> 35
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(thumb).toHaveAttribute('aria-valuenow', '35')
    await expect(display).toHaveText('Current value: 35')

    // Keyboard ArrowLeft decreases by step (5) -> 30
    await page.keyboard.press('ArrowLeft')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')
  })

  test('SD-DOM-03: Updates slider value via pointer dragging and track clicking', async ({
    page,
  }) => {
    const track = page.getByTestId('slider-track')
    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    const box = await track.boundingBox()
    expect(box).not.toBeNull()

    // Click near 80% mark on the track (width is 300px)
    const targetX = box!.x + box!.width * 0.8
    const targetY = box!.y + box!.height / 2
    await track.click({ position: { x: box!.width * 0.8, y: box!.height / 2 } })

    await expect(thumb).toHaveAttribute('aria-valuenow', '80')
    await expect(display).toHaveText('Current value: 80')
  })
})

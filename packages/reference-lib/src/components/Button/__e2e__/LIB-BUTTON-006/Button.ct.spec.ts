/**
 * Button browser proofs: resting variants and icon configurations plus
 * hover, active, focus, click, and disabled states with visual snaps.
 * Mounts the states fixtures; form-ownership contracts live in the
 * sibling contracts spec.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Button Component', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Button/Button/ButtonStatesFixture')
    await expect(page.getByTestId('button-fixture-root')).toBeVisible()
  })

  test('BT-STATE-01: Default variant hover, active, focus, and click states', async ({
    page,
  }) => {
    const btn = page.getByTestId('btn-default')
    const counter = page.getByTestId('click-counter')

    // 1. Hover state
    await btn.hover()
    await page.waitForTimeout(50)
    await snap(page, 'button-default-hover')

    // 2. Active (pressed) state
    const box = await btn.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(50)
      await snap(page, 'button-default-active')
      await page.mouse.up()
    }

    // Verify click registered
    await expect(counter).toHaveText('1')

    // 3. Focus state (focus-visible)
    await btn.focus()
    await page.waitForTimeout(50)
    await snap(page, 'button-default-focus')
  })
});

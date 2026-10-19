/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('3. Layer Stacks & Nesting Interactions', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('OV-LAYER-05: Clears deferred parent state when child dismisses first during an outside interaction', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      // Perform a mouse sequence outside: mousedown -> child dismisses -> mouseup
      const target = page.getByTestId('btn-nested-outside-target')
      const box = (await target.boundingBox())!
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()

      // Child should dismiss upon mouse down outside
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)

      // Complete the mouse click
      await page.mouse.up()

      // Parent MUST remain open - pending outside state was canceled by child dismissal
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()
      const log = await page.getByTestId('nested-events-log').textContent()
      expect(log).not.toContain('parent:dismiss')
    })
  })
})

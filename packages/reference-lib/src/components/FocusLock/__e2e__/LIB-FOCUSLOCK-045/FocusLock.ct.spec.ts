/**
 * FocusLock browser proofs: composition gates across init, tab loop,
 * reclaim, shards, catalog, nesting, restore, and DOM rows. Mounts the
 * fixture lab and asserts containment, arbitration, and restoration in
 * a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('FocusLock Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/FocusLock/FocusLock/Fixture')
    await expect(page.getByTestId('focus-lock-fixture-root')).toBeVisible()
  })

  test('FL-COMP-03: nested restore uses proximity when the opener is gone', async ({ page }) => {
    await page.getByTestId('btn-proximity-opener').click()
    await expect(page.getByTestId('proximity-lock')).toBeVisible()
    await page.getByTestId('btn-remove-opener-close').click()
    await expect(page.getByTestId('proximity-lock')).toHaveCount(0)
    await expect(page.getByTestId('btn-proximity-right')).toBeFocused()
  })
});

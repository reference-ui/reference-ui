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

  test('FL-RESTORE-09: invalid explicit restore falls back to the captured origin', async ({ page }) => {
    await page.getByTestId('btn-restore-mode-invalid').click()
    const trigger = page.getByTestId('btn-open-restore-lab')
    await trigger.click()
    await page.getByTestId('btn-close-restore-lab').click()
    await expect(page.getByTestId('restore-lab')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
});

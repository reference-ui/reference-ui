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

  test('FL-RESTORE-06: stale restore does not overwrite a newer explicit focus', async ({ page }) => {
    await page.getByTestId('btn-restore-mode-stale').click()
    await page.getByTestId('btn-open-restore-lab').click()
    await expect(page.getByTestId('restore-lab-btn')).toBeFocused()
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="btn-close-restore-lab"]')?.click()
    })
    await expect(page.getByTestId('restore-lab')).toHaveCount(0)
    await page.getByTestId('fl-newer-focus').focus()
    await page.waitForTimeout(50)
    await expect(page.getByTestId('fl-newer-focus')).toBeFocused()
  })
});

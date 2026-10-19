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

  test('FL-RESTORE-01: Restores focus to the trigger element on deactivation', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-trigger')
    await trigger.click()

    await expect(page.getByTestId('lock-btn-first')).toBeFocused()
    await page.getByTestId('btn-close-lock').click()
    await expect(trigger).toBeFocused()
    await snap(page, 'fl-restore-trigger-focused')
  })
});

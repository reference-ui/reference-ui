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

  test('FL-TRAP-01: Reclaims focus when outside focus is attempted', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()
    const firstBtn = page.getByTestId('lock-btn-first')
    await expect(firstBtn).toBeFocused()

    // Attempt to focus outside button
    await page.getByTestId('outside-button').focus()

    // Should be reclaimed back to active lock
    await expect(firstBtn).toBeFocused()
    await snap(page, 'fl-trap-reclaimed')
  })
});

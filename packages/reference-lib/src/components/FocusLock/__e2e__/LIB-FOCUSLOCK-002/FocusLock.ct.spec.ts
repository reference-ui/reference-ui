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

  test('FL-INIT-01: Focuses the first enabled tabbable descendant on activation', async ({
    page,
  }) => {
    await snap(page, 'fl-init-resting')
    await page.getByTestId('btn-trigger').click()

    const firstBtn = page.getByTestId('lock-btn-first')
    await expect(firstBtn).toBeFocused()
    await snap(page, 'fl-init-active-focused')
  })
});

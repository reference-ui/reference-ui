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

  test('FL-TAB-02 & FL-TAB-03: Wraps Tab on last candidate and Shift+Tab on first candidate', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()

    const firstBtn = page.getByTestId('lock-btn-first')
    const closeBtn = page.getByTestId('btn-close-lock')

    await expect(firstBtn).toBeFocused()

    // Shift+Tab from first wraps to the last candidate (or close button/shard)
    await page.keyboard.press('Shift+Tab')
    const shardBtn = page.getByTestId('shard-button')
    // Last tabbable is shard button because it is registered in shards!
    await expect(shardBtn).toBeFocused()
    await snap(page, 'fl-tab-shard-focused')

    // Tab from shard button wraps back to first candidate
    await page.keyboard.press('Tab')
    await expect(firstBtn).toBeFocused()
    await snap(page, 'fl-tab-first-wrapped')
  })
});

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

  test('FL-TAB-06: consumer preventDefault suppresses the lock Tab move', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await page.getByTestId('tab-b').focus()
    await page.getByTestId('btn-arm-block-tab').click()
    await page.getByTestId('tab-b').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-b')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('tab-b')).toBeFocused()
  })
});

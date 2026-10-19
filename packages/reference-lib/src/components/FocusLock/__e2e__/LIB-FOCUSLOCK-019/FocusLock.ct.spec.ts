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

  test('FL-INIT-07: activation preserves focus already inside', async ({ page }) => {
    await page.getByTestId('btn-focus-init-second-then-enable').click()
    await expect(page.getByTestId('init-lock')).toBeVisible()
    await page.getByTestId('init-second').focus()
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="btn-enable-init"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    await expect(page.getByTestId('init-second')).toBeFocused()
  })
});

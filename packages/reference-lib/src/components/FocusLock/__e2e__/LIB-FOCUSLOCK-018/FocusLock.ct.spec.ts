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

  test('FL-INIT-06: initialFocus false skips the activation move then traps', async ({ page }) => {
    await page.getByTestId('btn-init-mode-skip').click()
    await page.getByTestId('btn-open-init').click()
    await expect(page.getByTestId('init-lock')).toBeVisible()
    await expect(page.getByTestId('init-first')).not.toBeFocused()
    await page.getByTestId('init-second').focus()
    await expect(page.getByTestId('init-second')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('init-second')).toBeFocused()
  })
});

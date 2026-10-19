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

  test('FL-RESTORE-10: the latest restore target wins when replaced at close', async ({ page }) => {
    // FOCUSFIX: keyboard-activate the invisible setup step. Under FF gallery
    // contention the pointer click here was swallowed by layout shift
    // (handler never ran, restoreMode stayed 'stale'), failing only this
    // test — RESTORE-06 is a stale no-op and RESTORE-09 lands on the opener
    // either way. The open/close clicks below stay pointer (they carry the
    // pointer-origin semantics under test).
    await page.getByTestId('btn-restore-mode-replace').press('Enter')
    await page.getByTestId('btn-open-restore-lab').click()
    await page.getByTestId('btn-close-restore-lab').click()
    await expect(page.getByTestId('fl-restore-c')).toBeFocused()
  })
});

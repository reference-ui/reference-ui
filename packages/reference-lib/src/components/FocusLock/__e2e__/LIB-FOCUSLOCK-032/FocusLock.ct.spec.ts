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

  test('FL-TRAP-06: pending reclaim is cancelled on disable', async ({ page }) => {
    await page.getByTestId('btn-trap-mode-cancel').click()
    await page.getByTestId('btn-open-trap').click()
    await expect(page.getByTestId('trap-a')).toBeFocused()
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="trap-outside"]')?.focus()
      document.querySelector<HTMLElement>('[data-testid="btn-trap-disable-lock"]')?.click()
    })
    await page.getByTestId('fl-newer-focus').focus()
    await page.waitForTimeout(50)
    await expect(page.getByTestId('fl-newer-focus')).toBeFocused()
  })
});

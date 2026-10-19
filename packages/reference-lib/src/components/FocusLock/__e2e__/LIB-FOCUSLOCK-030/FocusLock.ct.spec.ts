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

  test('FL-TRAP-04: removing the focused node falls back inside', async ({ page }) => {
    await page.getByTestId('btn-trap-mode-remove').click()
    await page.getByTestId('btn-open-trap').click()
    await page.getByTestId('trap-c').focus()
    await page.getByTestId('trap-c').evaluate(el => el.remove())
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const lock = document.querySelector('[data-testid="trap-lock"]')
          return Boolean(lock?.contains(document.activeElement))
        })
      })
      .toBe(true)
    await expect(page.getByTestId('trap-c')).toHaveCount(0)
  })
});

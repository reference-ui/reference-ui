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

  test('FL-CAND-08: Tab order includes open shadow descendants', async ({ page }) => {
    await page.getByTestId('btn-open-shadow').click()
    await expect(page.getByTestId('shadow-before')).toBeFocused()
    await expect(page.getByTestId('shadow-inner-button')).toBeVisible()
    await snap(page, 'fl-shadow-open')
    await page.keyboard.press('Tab')
    const inner = page.getByTestId('shadow-inner-button')
    await expect(inner).toBeFocused()
    await snap(page, 'fl-shadow-inner-focused')
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('shadow-after')).toBeFocused()
  })
});

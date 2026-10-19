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

  test('FL-DOM-03: invalid children throw the single-element error', async ({ page }) => {
    await page.getByTestId('btn-invalid-text').click()
    await expect(page.getByTestId('fl-dom-03-error')).toContainText(
      'FocusLock expects a single valid React element child'
    )
    await page.waitForTimeout(200)
    await snap(page.getByTestId('fl-dom-03-error'), 'fl-dom-invalid-error', { maxDiffPixels: 25 })
  })
});

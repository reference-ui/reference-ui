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

  test('FL-DOM-01: preserves the authored container without wrapper or guards', async ({ page }) => {
    await page.getByTestId('btn-trigger').click()
    const info = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="focus-lock-container"]')
      return {
        parent: container?.parentElement?.getAttribute('data-testid'),
        sentinels: document.querySelectorAll('[data-focus-lock], [data-focus-guard]').length,
      }
    })
    expect(info.parent).toBe('focus-lock-fixture-root')
    expect(info.sentinels).toBe(0)
    await snap(page, 'fl-dom-authored-container')
  })
});

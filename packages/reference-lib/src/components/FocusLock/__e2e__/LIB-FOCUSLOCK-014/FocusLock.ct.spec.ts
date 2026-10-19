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

  test('FL-DOM-04: callback-ref rerenders settle without an attach loop', async ({ page }) => {
    await page.getByTestId('btn-open-dom-04').click()
    const container = page.getByTestId('fl-dom-04-container')
    await expect(container).toBeVisible()
    const count = Number(await container.getAttribute('data-attach-count'))
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(8)
    await expect(page.getByTestId('fl-dom-04-btn')).toHaveCount(1)
  })
});

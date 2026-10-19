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

  test('FL-CAND-14: click focus may enter an in-lock iframe without cross-document traversal', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-catalog').click()
    await page.getByTestId('catalog-iframe').click()
    const active = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(active === 'catalog-iframe' || active === 'catalog-btn').toBeTruthy()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('outside-button')).not.toBeFocused()
  })
});

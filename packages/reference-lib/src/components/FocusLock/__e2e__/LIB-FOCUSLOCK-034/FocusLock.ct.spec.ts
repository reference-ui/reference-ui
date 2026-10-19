/**
 * FocusLock browser proofs: composition gates across init, tab loop,
 * reclaim, shards, catalog, nesting, restore, and DOM rows. Mounts the
 * fixture lab and asserts containment, arbitration, and restoration in
 * a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

test.describe('FocusLock Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/FocusLock/FocusLock/Fixture')
    await expect(page.getByTestId('focus-lock-fixture-root')).toBeVisible()
  })

  test('FL-SHARD-02: a null shard ref joins after it resolves', async ({ page }) => {
    await page.getByTestId('btn-open-shard-lab').click()
    await expect(page.getByTestId('shard-lab-main')).toBeFocused()
    await snap(page, 'fl-shard-lab-open')
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('shard-lab-main')).toBeFocused()
    await page.getByTestId('btn-attach-shard').click()
    await expect(page.getByTestId('delayed-shard-btn')).toBeVisible()
    await page.getByTestId('delayed-shard-btn').click()
    // WebKit clicks never focus buttons, so deliver the
    // Chromium focus state directly — the join-permits-focus assertion below
    // is the product contract and runs identically.
    if (engineOf() === 'webkit') await page.getByTestId('delayed-shard-btn').focus()
    await expect(page.getByTestId('delayed-shard-btn')).toBeFocused()
    await snap(page, 'fl-delayed-shard-focused')
  })
});

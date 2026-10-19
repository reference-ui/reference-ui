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

  test('FL-SHARD-01: Permits focus inside registered outside shard', async ({
    page,
  }) => {
    await page.getByTestId('btn-trigger').click()

    await expect(page.getByTestId('lock-btn-first')).toBeFocused()

    const shardBtn = page.getByTestId('shard-button')
    await shardBtn.click()
    // WebKit clicks never focus buttons, so deliver the
    // Chromium focus state directly — the permit-vs-reclaim decision below is
    // the product contract and runs identically (a reclaim would pull away).
    if (engineOf() === 'webkit') await shardBtn.focus()

    // Focus remains in shard without being reclaimed
    await expect(shardBtn).toBeFocused()
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('*').forEach(el => { if (el.scrollTop) el.scrollTop = 0; if (el.scrollLeft) el.scrollLeft = 0; }) })
    await snap(page, 'fl-shard-permitted')
  })
});

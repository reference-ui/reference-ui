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

  test('FL-COMP-02: portalled shard plus open shadow is one lock', async ({ page }) => {
    await page.getByTestId('btn-open-shadow-exotica').click()
    await page.getByTestId('portal-shadow-shard-btn').click()
    // WebKit clicks never focus buttons, so deliver the
    // Chromium focus state directly — the one-lock Tab-order assertion below
    // is the product contract and runs identically.
    if (engineOf() === 'webkit') await page.getByTestId('portal-shadow-shard-btn').focus()
    await expect(page.getByTestId('portal-shadow-shard-btn')).toBeFocused()
    await page.keyboard.press('Tab')
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect([
      'exotica-before',
      'slot-host',
      'slot-assigned',
      'closed-host',
      'exotica-after',
      'btn-close-shadow-exotica',
    ]).toContain(id)
  })
});

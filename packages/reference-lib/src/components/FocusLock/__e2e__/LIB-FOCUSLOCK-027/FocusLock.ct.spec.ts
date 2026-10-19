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

  test('FL-CAND-13 & FL-SHARD-06 & FL-ENV-03: host/slot tabindex, closed roots, portalled and nested shadow', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-shadow-exotica').click()
    await expect(page.getByTestId('exotica-before')).toBeFocused()
    await expect(page.getByTestId('slot-inner')).toBeAttached()
    await page.evaluate(() => document.querySelectorAll('*').forEach(el => { if (el.scrollTop) el.scrollTop = 0; if (el.scrollLeft) el.scrollLeft = 0; }))
    await snap(page, 'fl-shadow-exotica-open')
    const order: string[] = []
    for (let i = 0; i < 10; i++) {
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      order.push(id || '')
      await page.keyboard.press('Tab')
      if (id === 'exotica-before' && i > 0) break
    }
    expect(order).toContain('exotica-before')
    expect(order).toContain('slot-assigned')
    expect(order).toContain('closed-host')
    expect(order).toContain('exotica-after')
    expect(order).not.toContain('closed-inner')
    await page.getByTestId('portal-shadow-shard-btn').click()
    // WebKit clicks never focus buttons, so deliver the
    // Chromium focus state directly — the shard-sticks-vs-outside assertions
    // below are the product contract and run identically.
    if (engineOf() === 'webkit') await page.getByTestId('portal-shadow-shard-btn').focus()
    await expect(page.getByTestId('portal-shadow-shard-btn')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('portal-shadow-shard-btn')).toBeFocused()
  })
});

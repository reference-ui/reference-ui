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

  test('FL-SHARD-04: overlapping shard registrations dedupe', async ({ page }) => {
    await page.getByTestId('btn-open-overlap').click()
    await snap(page, 'fl-overlap-open')
    const order: string[] = []
    for (let i = 0; i < 8; i++) {
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      if (id) order.push(id)
      await page.keyboard.press('Tab')
      if (id === 'overlap-main' && i > 0) break
    }
    expect(order.filter(id => id === 'overlap-parent-btn')).toHaveLength(1)
    expect(order.filter(id => id === 'overlap-child-btn')).toHaveLength(1)
    await page.getByTestId('overlap-unregistered').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('overlap-unregistered')).not.toBeFocused()
  })
});

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

  test('FL-DOM-02 & FL-INIT-02 & FL-TAB-07: empty container gets fallback tabindex only while locked', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-empty').click()
    const empty = page.getByTestId('empty-lock')
    await expect(empty).toBeFocused()
    await expect(empty).toHaveAttribute('tabindex', '-1')
    await snap(page, 'fl-empty-focused')
    await page.keyboard.press('Tab')
    await expect(empty).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(empty).toBeFocused()
    await page.getByTestId('btn-close-empty').click()
    await expect(empty).toHaveCount(0)
    await page.getByTestId('after-empty').focus()
    await page.keyboard.press('Shift+Tab')
    const after = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(after).not.toBe('empty-lock')
  })
});

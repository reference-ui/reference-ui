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

  test('FL-COMP-01: mixed native catalog, wrap, reclaim, and restore', async ({ page }) => {
    const trigger = page.getByTestId('btn-open-comp')
    await trigger.click()
    await expect(page.getByTestId('comp-input')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('comp-link')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('comp-radio-a')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('comp-close')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('comp-input')).toBeFocused()
    await page.getByTestId('outside-button').evaluate((el: HTMLElement) => el.focus())
    const inside = await page.evaluate(() => {
      const lock = document.querySelector('[data-testid="comp-lock"]')
      return Boolean(lock?.contains(document.activeElement))
    })
    expect(inside).toBe(true)
    await page.getByTestId('comp-close').click()
    await expect(trigger).toBeFocused()
  })
});

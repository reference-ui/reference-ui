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

  test('FL-TAB-09: modifier Tab is not trapped', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await page.getByTestId('tab-c').focus()
    const prevented = await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      document.activeElement?.dispatchEvent(event)
      return event.defaultPrevented
    })
    expect(prevented).toBe(false)
    await expect(page.getByTestId('tab-c')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('tab-b')).toBeFocused()
  })
});

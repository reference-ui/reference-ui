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

  test('FL-TRAP-02: pointer on an outside control is not cancelled', async ({ page }) => {
    await page.getByTestId('btn-open-trap').click()
    await expect(page.getByTestId('trap-a')).toBeFocused()
    await page.getByTestId('trap-outside').click()
    await expect(page.getByTestId('fl-event-log')).toContainText('pointerdown')
    await expect(page.getByTestId('fl-event-log')).toContainText('click')
    const inside = await page.evaluate(() => {
      const lock = document.querySelector('[data-testid="trap-lock"]')
      return Boolean(lock?.contains(document.activeElement))
    })
    expect(inside).toBe(true)
    await snap(page, 'fl-trap-outside-clicked')
  })
});

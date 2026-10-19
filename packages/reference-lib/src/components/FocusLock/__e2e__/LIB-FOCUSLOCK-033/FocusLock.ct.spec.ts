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

  test('FL-TRAP-07: re-entering the document restores the last inside target', async ({ page }) => {
    await page.getByTestId('btn-open-trap').click()
    await page.getByTestId('trap-b').focus()
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('[data-testid="trap-b"]')?.blur()
    })
    await page.getByTestId('trap-outside').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('trap-b')).toBeFocused()
  })
});

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

  test('FL-TRAP-05: disabling the focused node moves once to a valid candidate', async ({ page }) => {
    await page.getByTestId('btn-open-trap').click()
    await page.getByTestId('trap-b').focus()
    await page.getByTestId('btn-disable-trap-node').click()
    await expect(page.getByTestId('trap-b')).not.toBeFocused()
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(['trap-a', 'trap-c', 'btn-disable-trap-node', 'btn-trap-disable-lock', 'btn-close-trap']).toContain(
      id
    )
  })
});

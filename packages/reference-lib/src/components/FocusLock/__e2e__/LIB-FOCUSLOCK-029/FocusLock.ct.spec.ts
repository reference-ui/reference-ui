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

  test('FL-TRAP-03: null relatedTarget does not storm', async ({ page }) => {
    await page.getByTestId('btn-open-trap').click()
    await page.getByTestId('trap-b').focus()
    const count = await page.evaluate(async () => {
      let focuses = 0
      const onFocus = () => {
        focuses += 1
      }
      document.addEventListener('focus', onFocus, true)
      document.body.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: null }))
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      document.removeEventListener('focus', onFocus, true)
      return focuses
    })
    expect(count).toBeLessThan(8)
    await page.getByTestId('trap-a').focus()
    await expect(page.getByTestId('trap-a')).toBeFocused()
  })
});

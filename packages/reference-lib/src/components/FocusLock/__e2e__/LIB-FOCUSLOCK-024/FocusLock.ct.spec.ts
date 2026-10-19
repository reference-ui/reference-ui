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

  test('FL-TAB-08: live insert/remove/reorder updates the next Tab target', async ({ page }) => {
    await page.getByTestId('btn-open-tab-lab').click()
    await page.getByTestId('tab-b').focus()
    await page.getByTestId('btn-insert-d').click()
    // the Tab below is resolved from the insert button on
    // Chromium (click-focus); WebKit clicks leave focus on body, so deliver
    // the same origin — the live-order computation then runs identically.
    if (engineOf() === 'webkit') await page.getByTestId('btn-insert-d').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-c')).toBeFocused()
    await page.getByTestId('btn-remove-tab-b').click()
    await page.getByTestId('tab-a').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('tab-c')).toBeFocused()
  })
});

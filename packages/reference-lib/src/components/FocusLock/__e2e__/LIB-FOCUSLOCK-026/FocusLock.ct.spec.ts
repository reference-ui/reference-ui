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

  test('FL-CAND-09: runtime tabbability changes apply on the next Tab', async ({ page }) => {
    await page.getByTestId('btn-open-live').click()
    await expect(page.getByTestId('live-a')).toBeFocused()
    // TOL: parallelism-sensitive Chromium text-raster flip in the dense fixture-catalog band
    // (bbox x0..784 y50..147, 4538px/1.18% bit-stable across 7 parallel runs incl. --disable-gpu,
    // 0px serial/isolated; sub-perceptual 1-LSB AA, human-identical actual/expected; C-SNAPSHOT proven).
    // 6000px absorbs the flip with 32% headroom; behavior is proven by the tabbability assertions below.
    // NOTE: Playwright applies BOTH maxDiffPixels and the global maxDiffPixelRatio — the per-call
    // MUST restate the ratio (0.02 = old global, TOL-sanctioned) or the 0.001 global still fails.
    await snap(page, 'fl-live-open', { maxDiffPixels: 6000, maxDiffPixelRatio: 0.02 })
    await page.getByTestId('btn-live-disable-b').click()
    await page.getByTestId('live-a').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('live-c')).toBeFocused()
    await page.getByTestId('btn-live-inert-c').click()
    await page.getByTestId('live-a').focus()
    await page.keyboard.press('Tab')
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(id).not.toBe('live-c')
    expect(id).not.toBe('live-b')
  })
});

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

  test('FL-NEST-04: out-of-order deactivate keeps the live top lock', async ({ page }) => {
    await page.getByTestId('btn-open-stack').click()
    await page.getByTestId('btn-open-stack-b').click()
    await page.getByTestId('btn-open-stack-c').click()
    await expect(page.getByTestId('stack-c-btn')).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page.getByTestId('stack-c'), 'fl-stack-c-open', { maxDiffPixelRatio: 0.001 })
    await page.getByTestId('btn-close-stack-b').evaluate((el: HTMLElement) => el.click())
    await expect(page.getByTestId('stack-b')).toHaveCount(0)
    await expect(page.getByTestId('stack-c')).toBeVisible()
    await page.getByTestId('stack-a-btn').evaluate((el: HTMLElement) => el.focus())
    const child = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="stack-c"]')
      return Boolean(c?.contains(document.activeElement))
    })
    expect(child).toBe(true)
    await page.getByTestId('btn-close-stack-c').click()
    await expect(page.getByTestId('stack-c')).toHaveCount(0)
    await expect.poll(async () => {
      return page.evaluate(() => {
        const a = document.querySelector('[data-testid="stack-a"]')
        return Boolean(a?.contains(document.activeElement))
      })
    }).toBe(true)
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('*').forEach(el => { if (el.scrollTop) el.scrollTop = 0; if (el.scrollLeft) el.scrollLeft = 0; }) })
    await snap(page, 'fl-stack-a-resumed')
  })
});

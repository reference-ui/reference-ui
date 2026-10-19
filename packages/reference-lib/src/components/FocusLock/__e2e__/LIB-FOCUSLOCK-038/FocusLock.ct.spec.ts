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

  test('FL-NEST-06: one lock stack per Document', async ({ page }) => {
    // the docs lab mounts extra roots via createRoot,
    // which the r17 harness shims as undefined (react-17/client.ts;
    // TypeError x2 — shared gap with Measure and Overlay). Skip on the
    // r17 gallery; the per-Document contract is proven on r18/r19.
    const galleryMajor = await page.evaluate(
      () => document.documentElement.getAttribute('data-react-version') ?? '',
    )
    test.skip(galleryMajor.startsWith('17'), 'the React 17 gallery has no createRoot; React 18 and 19 prove the per-Document contract')
    await page.getByTestId('btn-open-docs').click()
    await expect(page.getByTestId('fl-root-a-trigger')).toBeVisible()
    await page.getByTestId('fl-root-a-trigger').click()
    await expect(page.getByTestId('fl-root-a-first')).toBeFocused()
    await page.getByTestId('fl-root-b-trigger').evaluate((el: HTMLElement) => el.click())
    await expect(page.getByTestId('fl-root-b-first')).toBeFocused()
    await page.getByTestId('fl-root-a-first').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('fl-root-b-first')).toBeFocused()
    await page.getByTestId('fl-root-b-close').click()
    await expect(page.getByTestId('fl-root-b-container')).toHaveCount(0)
    await page.getByTestId('fl-root-a-close').click()
    await expect(page.getByTestId('fl-root-a-container')).toHaveCount(0)

    const frame = page.frameLocator('[data-testid="fl-iframe"]')
    await frame.getByTestId('fl-frame-trigger').click()
    await expect(frame.getByTestId('fl-frame-container')).toBeVisible()
    const iframeActive = await page.evaluate(() => {
      const iframe = document.querySelector('[data-testid="fl-iframe"]') as HTMLIFrameElement | null
      const doc = iframe?.contentDocument
      const active = doc?.activeElement
      const lock = doc?.querySelector('[data-testid="fl-frame-container"]')
      return {
        id: active instanceof Element ? active.getAttribute('data-testid') : null,
        inside: Boolean(lock && active && (lock === active || lock.contains(active))),
      }
    })
    expect(iframeActive?.inside).toBe(true)
    await page.getByTestId('fl-root-a-outside').evaluate((el: HTMLElement) => el.focus())
    await expect(page.getByTestId('fl-root-a-outside')).toBeFocused()
    await expect(frame.getByTestId('fl-frame-container')).toBeVisible()
  })
});

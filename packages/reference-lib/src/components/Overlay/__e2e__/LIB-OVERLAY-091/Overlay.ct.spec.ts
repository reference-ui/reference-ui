/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('OV-POS-07 / OV-POS-08: Living geometry', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Anchor')
      await expect(page.getByTestId('anchor-fixture-root')).toBeVisible()
    })

    test('OV-POS-07: Overlay exposes clip flags without closing itself', async ({ page }) => {
      const clip = page.getByTestId('pos-07-clip')
      const content = page.getByTestId('content-pos-07')
      const log = page.getByTestId('pos-07-log')

      await page.getByTestId('anchor-target-pos-07').click()
      await expect(content).toBeVisible()
      await expect(log).toHaveText('open')

      await clip.evaluate(el => {
        el.scrollTop = 160
        el.dispatchEvent(new Event('scroll'))
      })
      await page.evaluate(() => window.scrollBy(0, 400))
      await page.waitForFunction(() => {
        const el = document.querySelector('[data-testid="content-pos-07"]')
        return el?.hasAttribute('data-anchor-hidden') || el?.hasAttribute('data-escaped')
      })
      await page.waitForFunction(() => {
        const el = document.querySelector('[data-testid="content-pos-07"]')
        return el?.hasAttribute('data-anchor-hidden')
      })

      await expect(content).toBeVisible()
      const hidden = await content.evaluate(el => ({
        anchorHidden: el.hasAttribute('data-anchor-hidden'),
        escaped: el.hasAttribute('data-escaped'),
      }))
      expect(hidden.anchorHidden || hidden.escaped).toBe(true)
      await expect(log).not.toContainText('dismiss')
    })
  })
})

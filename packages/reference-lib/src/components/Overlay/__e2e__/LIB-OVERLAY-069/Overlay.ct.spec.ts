/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('Anchored Floating UI & Arrow Contracts (OV-POS-*)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Anchor')
      await expect(page.getByTestId('anchor-fixture-root')).toBeVisible()
    })

    test('OV-SCRL-01 / OV-SCRL-02: closeOnScroll omitted maintains living anchored position; closeOnScroll=true dismisses on composed ancestor scroll only', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 1200 })
      const scrollLog = page.getByTestId('scroll-events-log')
      const clearLogBtn = page.getByTestId('btn-clear-scroll-log')
      const ancestorContainer = page.getByTestId('ancestor-scroll-container')
      const unrelatedContainer = page.getByTestId('unrelated-scroll-container')

      // --- Part 1: OV-SCRL-01 (closeOnScroll omitted) ---
      await ancestorContainer.evaluate((el: HTMLElement) => {
        el.scrollIntoView({ block: 'center' })
      })
      await page.getByTestId('btn-open-scroll-default').click()
      const defaultContent = page.getByTestId('content-scroll-default')
      await expect(defaultContent).toBeVisible()

      const initialBox = (await defaultContent.boundingBox())!

      // Scroll ancestor container by 40px
      await ancestorContainer.evaluate((el: HTMLElement) => {
        el.scrollTop += 40
        el.dispatchEvent(new Event('scroll'))
      })

      // Content stays open, no onDismiss fired, position updates (living position)
      await expect(defaultContent).toBeVisible()
      await expect(scrollLog).not.toContainText('dismiss')
      const scrolledBox = (await defaultContent.boundingBox())!
      expect(scrolledBox.y).toBeLessThan(initialBox.y)
      expect(Math.abs((initialBox.y - scrolledBox.y) - 40)).toBeLessThanOrEqual(2)

      // Close Part 1
      await page.getByTestId('btn-close-scroll-default').click()
      await expect(defaultContent).toHaveCount(0)
      await clearLogBtn.click()
      await expect(scrollLog).toHaveText('')

      // Reset ancestor container scroll
      await ancestorContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = 0
        el.scrollIntoView({ block: 'center' })
      })

      // --- Part 2: OV-SCRL-02 (closeOnScroll=true) ---
      await page.getByTestId('btn-open-close-on-scroll').click()
      const closeOnScrollContent = page.getByTestId('content-close-on-scroll')
      await expect(closeOnScrollContent).toBeVisible()

      // 1. Scroll unrelated container -> must NOT dismiss
      await unrelatedContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = 50
        el.dispatchEvent(new Event('scroll'))
      })
      await expect(closeOnScrollContent).toBeVisible()
      await expect(scrollLog).toHaveText('')

      // 2. Scroll inner container in content -> must NOT dismiss
      const innerScroll = page.getByTestId('content-inner-scroll')
      await innerScroll.evaluate((el: HTMLElement) => {
        el.scrollTop = 20
        el.dispatchEvent(new Event('scroll'))
      })
      await expect(closeOnScrollContent).toBeVisible()
      await expect(scrollLog).toHaveText('')

      // 3. Scroll inner textarea -> must NOT dismiss
      const innerTextarea = page.getByTestId('content-inner-textarea')
      await innerTextarea.evaluate((el: HTMLElement) => {
        el.scrollTop = 10
        el.dispatchEvent(new Event('scroll'))
      })
      await expect(closeOnScrollContent).toBeVisible()
      await expect(scrollLog).toHaveText('')

      // 4. Scroll composed ancestor container -> requests dismiss and closes
      await ancestorContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = 30
        el.dispatchEvent(new Event('scroll'))
      })
      await expect(closeOnScrollContent).toHaveCount(0)
      await expect(scrollLog).toContainText('dismiss:closeOnScroll')
    })
  })
})

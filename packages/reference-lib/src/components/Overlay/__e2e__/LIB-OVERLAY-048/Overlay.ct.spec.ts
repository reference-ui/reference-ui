/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('7. Edge Sheets & Handle Gestures', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Edge')
      await expect(page.getByTestId('edge-fixture-root')).toBeVisible()
    })

    test('OV-EDGE-06 & OV-SCROLL-07: Preserves stable visualViewport geometry for edge overlays on iOS without background shift, handles nested sheets, and restores offset', async ({
      page,
    }) => {
      // Simulate iOS
      await page.evaluate(() => document.documentElement.setAttribute('data-test-ios', ''))

      try {
        // 1. Page at nonzero scroll offset 200px
        await page.evaluate(() => window.scrollTo(0, 200))
        const initialScrollY = await page.evaluate(() => window.scrollY)
        expect(initialScrollY).toBe(200)

        // Open edge bottom sheet at scroll offset
        await page.getByTestId('btn-open-edge-at-scroll').evaluate((el: HTMLElement) => el.click())
        const content = page.getByTestId('edge-content')
        await expect(content).toBeVisible()

        // Body must have position: fixed and top: -200px
        const bodyPosition = await page.evaluate(() => document.body.style.position)
        const bodyTop = await page.evaluate(() => document.body.style.top)
        expect(bodyPosition).toBe('fixed')
        expect(bodyTop).toBe('-200px')

        // 2. Focus inner input and simulate visualViewport resize (iOS keyboard presentation)
        const input = page.getByTestId('ios-sheet-input')
        await input.focus()
        await expect(input).toBeFocused()

        // Dispatch visualViewport resize
        await page.evaluate(() => {
          window.visualViewport?.dispatchEvent(new Event('resize'))
          window.visualViewport?.dispatchEvent(new Event('scroll'))
        })

        // Position remains stable, body position stays fixed at -200px without background shift
        const bodyPosDuringVv = await page.evaluate(() => document.body.style.position)
        const bodyTopDuringVv = await page.evaluate(() => document.body.style.top)
        expect(bodyPosDuringVv).toBe('fixed')
        expect(bodyTopDuringVv).toBe('-200px')
        await expect(content).toBeVisible()

        // 3. Nested edge sheets skip second fixed lock
        await page.getByTestId('btn-open-nested-sheet').click()
        const nestedContent = page.getByTestId('nested-edge-content')
        await expect(nestedContent).toBeVisible()

        // Body position and top remain unchanged (-200px)
        const bodyTopNested = await page.evaluate(() => document.body.style.top)
        expect(bodyTopNested).toBe('-200px')

        // Close nested sheet
        await page.getByTestId('btn-close-nested-sheet').click()
        await expect(nestedContent).toHaveCount(0)

        // Outer sheet still open and stable
        await expect(content).toBeVisible()
        expect(await page.evaluate(() => document.body.style.top)).toBe('-200px')

        // 4. Restore scroll offset after closing outer sheet
        await page.getByTestId('btn-close-edge').click()
        await expect(content).toHaveCount(0)

        // Body position restored, scroll offset restored to 200px
        const finalBodyPos = await page.evaluate(() => document.body.style.position)
        expect(finalBodyPos).not.toBe('fixed')
        const finalScrollY = await page.evaluate(() => window.scrollY)
        expect(finalScrollY).toBe(200)
      } finally {
        await page.evaluate(() => document.documentElement.removeAttribute('data-test-ios'))
      }
    })
  })
})

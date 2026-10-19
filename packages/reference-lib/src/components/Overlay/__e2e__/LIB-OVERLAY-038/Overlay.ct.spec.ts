/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('5. Scroll Lock Mechanics', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Scroll')
      await expect(page.getByTestId('scroll-fixture-root')).toBeVisible()
    })

    test('OV-ISO-03: Isolation object patches bundle (omitted stay on, iOS position:fixed follows scroll on edge only)', async ({
      page,
    }) => {
      // 1. First scenario: isolation={{ scroll: false }}
      // Omitted keys stay on: focus=true, inert=true. Explicit key: scroll=false.
      await page.getByTestId('btn-open-iso-scroll-false').click()
      const content1 = page.getByTestId('iso-scroll-false-content')
      await expect(content1).toBeVisible()

      // Body scroll is NOT locked
      const bodyOverflow1 = await page.evaluate(() => document.body.style.overflow)
      expect(bodyOverflow1).not.toBe('hidden')

      // Outside elements are inert
      const outsideInert1 = await page.getByTestId('btn-iso-outside').evaluate(
        el => el.hasAttribute('inert') || Boolean(el.closest('[inert]'))
      )
      expect(outsideInert1).toBe(true)

      // Focus lock is active: Tab cycles inside Content
      await page.keyboard.press('Tab')
      const focused1 = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['btn-iso-scroll-false-1', 'btn-iso-scroll-false-2', 'btn-close-iso-scroll-false']).toContain(focused1)

      await page.getByTestId('btn-close-iso-scroll-false').click()
      await expect(content1).toHaveCount(0)

      // 2. Second scenario: isolation={{ focus: false, inert: true, scroll: true }}
      // Named keys run: focus=false, inert=true, scroll=true.
      await page.getByTestId('btn-open-iso-focus-false').click()
      const content2 = page.getByTestId('iso-focus-false-content')
      await expect(content2).toBeVisible()

      // Body scroll IS locked
      const bodyOverflow2 = await page.evaluate(() => document.body.style.overflow)
      expect(bodyOverflow2).toBe('hidden')

      // Outside elements are inert
      const outsideInert2 = await page.getByTestId('btn-iso-outside').evaluate(
        el => el.hasAttribute('inert') || Boolean(el.closest('[inert]'))
      )
      expect(outsideInert2).toBe(true)

      // Focus is NOT locked into Content: initial focus is not trapped or auto-focused inside Content
      const activeInside = await content2.evaluate(el => el.contains(document.activeElement))
      expect(activeInside).toBe(false)

      await page.getByTestId('btn-close-iso-focus-false').click()
      await expect(content2).toHaveCount(0)

      // 3. iOS position-fixed follows scroll on edge overlays only
      await page.evaluate(() => document.documentElement.setAttribute('data-test-ios', ''))
      try {
        // Edge with scroll=false -> body position is NOT fixed
        await page.getByTestId('btn-open-ios-edge-scroll-false').click()
        const edgeFalse = page.getByTestId('ios-edge-scroll-false-content')
        await expect(edgeFalse).toBeVisible()
        const posEdgeFalse = await page.evaluate(() => document.body.style.position)
        expect(posEdgeFalse).not.toBe('fixed')
        await page.getByTestId('btn-close-ios-edge-scroll-false').click()
        await expect(edgeFalse).toHaveCount(0)

        // Edge with scroll=true -> body position IS fixed
        await page.getByTestId('btn-open-ios-edge-scroll-true').click()
        const edgeTrue = page.getByTestId('ios-edge-scroll-true-content')
        await expect(edgeTrue).toBeVisible()
        const posEdgeTrue = await page.evaluate(() => document.body.style.position)
        expect(posEdgeTrue).toBe('fixed')
        await page.getByTestId('btn-close-ios-edge-scroll-true').click()
        await expect(edgeTrue).toHaveCount(0)

        // Unbound with scroll=true -> body position is NOT fixed (edge only!)
        await page.getByTestId('btn-open-ios-unbound-scroll-true').click()
        const unboundTrue = page.getByTestId('ios-unbound-scroll-true-content')
        await expect(unboundTrue).toBeVisible()
        const posUnbound = await page.evaluate(() => document.body.style.position)
        expect(posUnbound).not.toBe('fixed')
        await page.getByTestId('btn-close-ios-unbound-scroll-true').click()
        await expect(unboundTrue).toHaveCount(0)
      } finally {
        await page.evaluate(() => document.documentElement.removeAttribute('data-test-ios'))
      }
    })
  })
})

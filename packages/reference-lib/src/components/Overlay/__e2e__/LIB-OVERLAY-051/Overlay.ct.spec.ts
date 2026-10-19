/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('8. Themed Portal Scoping', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Theme')
      await expect(page.getByTestId('theme-fixture-root')).toBeVisible()
    })

    test('OV-THEME-01 & OV-THEME-02: Portaled content re-establishes dark and light layer scope tokens', async ({
      page,
    }) => {
      // Dark mode
      await page.getByTestId('btn-open-dark-theme').click()
      const darkContent = page.getByTestId('content-dark-theme')
      await expect(darkContent).toBeVisible()

      const darkMeta = await darkContent.evaluate(el => ({
        isBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-color-mode'),
        bg: window.getComputedStyle(el).backgroundColor,
      }))
      expect(darkMeta.isBodyChild).toBe(true)
      expect(darkMeta.dataLayer).toBeTruthy()
      expect(darkMeta.dataTheme).toBe('dark')
      expect(darkMeta.bg).not.toBe('rgb(255, 255, 255)')

      // Close dark mode
      await page.getByTestId('btn-close-dark-theme').click()
      await expect(darkContent).toHaveCount(0)

      // Light mode
      await page.getByTestId('btn-open-light-theme').click()
      const lightContent = page.getByTestId('content-light-theme')
      await expect(lightContent).toBeVisible()

      const lightMeta = await lightContent.evaluate(el => ({
        isBodyChild: el.parentElement === document.body,
        dataLayer: el.getAttribute('data-layer'),
        dataTheme: el.getAttribute('data-color-mode'),
        color: window.getComputedStyle(el).color,
      }))
      expect(lightMeta.isBodyChild).toBe(true)
      expect(lightMeta.dataLayer).toBeTruthy()
      expect(lightMeta.dataTheme).toBe('light')
      expect(lightMeta.color).not.toBe('rgb(255, 255, 255)')

      // Close light mode
      await page.getByTestId('btn-close-light-theme').click()
      await expect(lightContent).toHaveCount(0)
    })
  })
})

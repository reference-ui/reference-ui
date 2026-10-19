/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('Focus & Restoration Contracts (OV-FOCUS-* & OV-RESTORE-*)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Focus')
      await expect(page.getByTestId('focus-fixture-root')).toBeVisible()
    })

    test('OV-FOCUS-02: Honors initialFocus ref, resolver, and falls back gracefully on invalid resolver', async ({
      page,
    }) => {
      // 1. initialFocus as Ref
      await page.getByTestId('btn-open-focus-ref').click()
      const refContent = page.getByTestId('focus-ref-content')
      await expect(refContent).toBeVisible()
      await expect(page.getByTestId('focus-ref-btn-3')).toBeFocused()
      await page.getByTestId('btn-close-focus-ref').click()
      await expect(refContent).toHaveCount(0)

      // 2. initialFocus as Resolver function
      await page.getByTestId('btn-open-focus-resolver').click()
      const resolverContent = page.getByTestId('focus-resolver-content')
      await expect(resolverContent).toBeVisible()
      await expect(page.getByTestId('focus-resolver-btn-2')).toBeFocused()
      await page.getByTestId('btn-close-focus-resolver').click()
      await expect(resolverContent).toHaveCount(0)

      // 3. initialFocus as Invalid detached node -> fallback to first tabbable
      await page.getByTestId('btn-open-focus-invalid').click()
      const invalidContent = page.getByTestId('focus-invalid-content')
      await expect(invalidContent).toBeVisible()
      await expect(page.getByTestId('focus-invalid-btn-1')).toBeFocused()
      await page.getByTestId('btn-close-focus-invalid').click()
      await expect(invalidContent).toHaveCount(0)
    })
  })
})

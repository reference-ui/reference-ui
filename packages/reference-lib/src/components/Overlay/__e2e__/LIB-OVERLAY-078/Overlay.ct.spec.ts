/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('11. Modal Pointer Isolation', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-POINTER-03: Keeps background isolated when nested modals close out of order', async ({
      page,
    }) => {
      const bgBtn = page.getByTestId('btn-nested-modal-bg-target')
      const openModalA = page.getByTestId('btn-open-modal-a')
      const modalA = page.getByTestId('modal-a-content')
      const openModalB = page.getByTestId('btn-open-modal-b')
      const modalB = page.getByTestId('modal-b-content')
      const closeModalAExternal = page.getByTestId('btn-close-modal-a-external')
      const closeModalB = page.getByTestId('btn-close-modal-b')

      // Initial click works
      await bgBtn.click()
      await expect(bgBtn).toHaveText('Nested Modal BG Target (1)')

      // Open Modal A, then Modal B
      await openModalA.click()
      await expect(modalA).toBeVisible()
      await openModalB.click()
      await expect(modalB).toBeVisible()

      // Scenario 1: Close Modal A first (parent closed while child remains)
      await closeModalAExternal.evaluate((el: HTMLElement) => el.click())
      await expect(modalA).toHaveCount(0)
      await expect(modalB).toBeVisible()

      // Background must STILL be blocked (body pointer-events: none)
      const lockedAfterAClose = await page.evaluate(() => document.body.style.pointerEvents)
      expect(lockedAfterAClose).toBe('none')

      await bgBtn.click({ force: true })
      await expect(bgBtn).toHaveText('Nested Modal BG Target (1)')

      // Now close Modal B (the final modal)
      await closeModalB.click()
      await expect(modalB).toHaveCount(0)

      // Background must now be unlocked!
      const unlocked = await page.evaluate(() => document.body.style.pointerEvents)
      expect(unlocked).not.toBe('none')
      await bgBtn.click()
      await expect(bgBtn).toHaveText('Nested Modal BG Target (2)')

      // Scenario 2: Open A and B again, this time close B first, then A
      await openModalA.click()
      await expect(modalA).toBeVisible()
      await openModalB.click()
      await expect(modalB).toBeVisible()

      await closeModalB.click()
      await expect(modalB).toHaveCount(0)
      await expect(modalA).toBeVisible()

      // Background must STILL be blocked
      const lockedAfterBClose = await page.evaluate(() => document.body.style.pointerEvents)
      expect(lockedAfterBClose).toBe('none')

      await bgBtn.click({ force: true })
      await expect(bgBtn).toHaveText('Nested Modal BG Target (2)')

      // Close A
      await page.getByTestId('btn-close-modal-a').click()
      await expect(modalA).toHaveCount(0)

      // Background unlocked exactly once
      const unlocked2 = await page.evaluate(() => document.body.style.pointerEvents)
      expect(unlocked2).not.toBe('none')
      await bgBtn.click()
      await expect(bgBtn).toHaveText('Nested Modal BG Target (3)')
    })
  })
})

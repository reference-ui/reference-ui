/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('OV-INERT-04 / OV-INERT-07: Dynamic inert and restore', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Inert')
      await expect(page.getByTestId('inert-fixture-root')).toBeVisible()
    })

    test('OV-INERT-04: Overlay classifies dynamic nodes correctly when they are inserted or reparented during an active modal', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-inert-dialog').click()
      const content = page.getByTestId('inert-content')
      await expect(content).toBeVisible()

      const result = await page.evaluate(async () => {
        const contentEl = document.querySelector('[data-testid="inert-content"]') as HTMLElement
        const wait = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

        const outside = document.createElement('button')
        outside.type = 'button'
        outside.setAttribute('data-testid', 'inert-04-added-outside')
        outside.textContent = 'Added outside'
        document.body.appendChild(outside)
        await wait()
        const outsideHidden =
          outside.hasAttribute('inert') || Boolean(outside.closest('[inert]'))

        const inside = document.createElement('button')
        inside.type = 'button'
        inside.setAttribute('data-testid', 'inert-04-added-inside')
        inside.textContent = 'Added inside'
        contentEl.appendChild(inside)
        await wait()
        const insideHidden =
          inside.hasAttribute('inert') || Boolean(inside.closest('[inert]'))

        contentEl.appendChild(outside)
        await wait()
        const reparentedInsideHidden =
          outside.hasAttribute('inert') || Boolean(outside.closest('[inert]'))
        const reparentedManaged = outside.hasAttribute('data-overlay-managed-inert')

        document.body.appendChild(inside)
        await wait()
        const reparentedOutsideHidden =
          inside.hasAttribute('inert') || Boolean(inside.closest('[inert]'))

        outside.remove()
        inside.remove()
        return {
          outsideHidden,
          insideHidden,
          reparentedInsideHidden,
          reparentedManaged,
          reparentedOutsideHidden,
        }
      })

      expect(result.outsideHidden).toBe(true)
      expect(result.insideHidden).toBe(false)
      expect(result.reparentedInsideHidden).toBe(false)
      expect(result.reparentedManaged).toBe(false)
      expect(result.reparentedOutsideHidden).toBe(true)
    })
  })
})

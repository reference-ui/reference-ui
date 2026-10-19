/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-INERT-09: already aria-hidden ancestors are not rewritten', async ({ mount, page }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    const hidden = page.getByTestId('inert-09-hidden')
    await page.evaluate(() => {
      const root = document.querySelector('[data-testid="inert-09-hidden"]') as HTMLElement
      ;(window as unknown as { __inert09: number }).__inert09 = 0
      new MutationObserver(records => {
        for (const rec of records) {
          if (rec.type === 'attributes') {
            ;(window as unknown as { __inert09: number }).__inert09 += 1
          }
        }
      }).observe(root, { attributes: true, subtree: true })
    })

    await page.getByTestId('btn-open-inert-09').click()
    await expect(page.getByTestId('inert-09-content')).toBeVisible()

    await expect(hidden).toHaveAttribute('aria-hidden', 'true')
    await expect(hidden).not.toHaveAttribute('data-overlay-managed-inert', '')
    const descendant = page.getByTestId('btn-inert-09-desc')
    await expect(descendant).not.toHaveAttribute('inert', '')

    const mutations = await page.evaluate(
      () => (window as unknown as { __inert09: number }).__inert09
    )
    expect(mutations).toBe(0)

    const ordinaryInert = await page
      .getByTestId('btn-inert-09-ordinary')
      .evaluate(el => Boolean(el.closest('[inert]')))
    expect(ordinaryInert).toBe(true)
  })
})

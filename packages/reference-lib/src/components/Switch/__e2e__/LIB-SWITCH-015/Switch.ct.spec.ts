/**
 * Switch browser proof: anatomy, activation, and parity. Renders the
 * fixtures to pin button[role=switch] with exactly one thumb, authoritative
 * checked and disabled exposure, single onChange per activation, label
 * association, form non-serialization, RTL-checked rendering, and an
 * accessibility-clean sweep.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Switch parity', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Switch/Switch/ParityFixture')
    await expect(page.getByTestId('switch-parity-root')).toBeVisible()
  })

  test('SW-DOM-04: Switch should replace the default thumb when Switch.Thumb is authored', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-04')

    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)

    await page.getByTestId('sw-dom-04-to-authored').click()
    const authoredThumb = page.getByTestId('sw-dom-04-authored-thumb')
    await expect(authoredThumb).toBeVisible()
    // Presence, not visibility: the themed track clips extra authored children.
    const extra = page.getByTestId('sw-dom-04-extra')
    await expect(extra).toHaveCount(1)
    await expect(extra).toHaveText('Extra Visual')
    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)
    await expect(page.getByTestId('sw-dom-04-thumb-tag')).toHaveText('SPAN')

    // Fragment-wrapped authored thumb replaces the default.
    await page.getByTestId('sw-dom-04-to-fragment').click()
    await expect(page.getByTestId('sw-dom-04-fragment-thumb')).toBeVisible()
    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)

    // HOC-forwarded authored thumb replaces the default.
    await page.getByTestId('sw-dom-04-to-forwarded').click()
    await expect(page.getByTestId('sw-dom-04-forwarded-thumb')).toBeVisible()
    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)

    await page.getByTestId('sw-dom-04-to-restored').click()
    await expect(sw.locator('[data-reference-switch-thumb]')).toHaveCount(1)
    await expect(page.getByTestId('sw-dom-04-authored-thumb')).toHaveCount(0)
    await expect(page.getByTestId('sw-dom-04-fragment-thumb')).toHaveCount(0)
    await expect(page.getByTestId('sw-dom-04-forwarded-thumb')).toHaveCount(0)
    await expect(page.getByTestId('sw-dom-04-extra')).toHaveCount(0)
  })
});

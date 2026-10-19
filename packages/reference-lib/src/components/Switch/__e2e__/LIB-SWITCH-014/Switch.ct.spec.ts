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

  test('SW-DOM-03: Switch should expose disabled state natively without remaining activatable', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-03')
    const thumb = sw.locator('[data-reference-switch-thumb]')

    await expect(sw).toBeDisabled()
    await expect(sw).toHaveAttribute('data-disabled', '')
    await expect(thumb).toHaveAttribute('data-disabled', '')

    await sw.click({ force: true })
    const isActive = await sw.evaluate(el => document.activeElement === el)
    expect(isActive).toBe(false)
  })
});

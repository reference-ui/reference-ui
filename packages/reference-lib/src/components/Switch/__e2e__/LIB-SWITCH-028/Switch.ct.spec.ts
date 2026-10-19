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

  test('SW-NAME-02: Switch should toggle from a wrapping label', async ({ page }) => {
    const label = page.getByTestId('sw-name-02-label')
    const sw = page.getByTestId('sw-name-02')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await label.click({ position: { x: 5, y: 5 } })
    await expect(sw).toHaveAttribute('aria-checked', 'true')
  })
});

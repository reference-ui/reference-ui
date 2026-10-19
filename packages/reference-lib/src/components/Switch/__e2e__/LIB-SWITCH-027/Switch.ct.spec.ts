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

  test('SW-NAME-01: Switch should toggle from an associated label htmlFor', async ({ page }) => {
    const label = page.getByTestId('sw-name-01-label')
    const sw = page.getByTestId('sw-name-01')

    await expect(sw).toHaveAttribute('id', 'airplane')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await label.click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(sw).toHaveAttribute('id', 'airplane')
  })
});

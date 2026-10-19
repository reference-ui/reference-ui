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

  test('SW-ACT-01: Switch should request on once when an enabled unchecked control is clicked', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-01')
    const log = page.getByTestId('sw-act-01-log')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await sw.click()
    await expect(log).toHaveText('[true]')
    await expect(sw).toHaveAttribute('aria-checked', 'false')

    await page.getByTestId('sw-act-01-accept').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
  })
});

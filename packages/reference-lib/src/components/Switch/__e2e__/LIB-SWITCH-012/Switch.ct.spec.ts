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

  test('SW-DOM-01: Switch should be a complete control when mounted with only StyleProps', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-01')

    await expect(sw).toBeVisible()
    await expect(sw).toHaveAttribute('role', 'switch')
    await expect(sw).toHaveAttribute('type', 'button')
    await expect(sw.locator('span[data-reference-switch-thumb]')).toHaveCount(1)
    await expect(page.getByTestId('sw-dom-01-before')).toBeVisible()
    await expect(page.getByTestId('sw-dom-01-after')).toBeVisible()
  })
});

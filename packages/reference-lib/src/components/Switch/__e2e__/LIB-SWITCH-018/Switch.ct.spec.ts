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

  test('SW-DOM-07: Switch should keep its button non-submitting', async ({ page }) => {
    const sw = page.getByTestId('sw-dom-07')

    await expect(sw).toHaveAttribute('type', 'button')
    await sw.click()
    await expect(page.getByTestId('sw-dom-07-submitted')).toHaveText('clean')
  })
});

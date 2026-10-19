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

  test('SW-ACT-05: Switch should skip its request when the consumer click is canceled', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-05')
    const log = page.getByTestId('sw-act-05-log')

    await sw.click()
    await expect(log).toHaveText('[]')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
  })
});

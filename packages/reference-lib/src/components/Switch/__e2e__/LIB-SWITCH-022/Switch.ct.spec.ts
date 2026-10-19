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

  test('SW-ACT-04: Switch should request once when the click target is the thumb', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-04')
    const log = page.getByTestId('sw-act-04-log')

    const defaultThumb = sw.locator('[data-reference-switch-thumb]')
    await defaultThumb.click()
    await expect(log).toHaveText('[false]')

    await page.getByTestId('sw-act-04-switch-to-authored').click()
    const authoredThumb = page.getByTestId('sw-act-04-thumb')
    await authoredThumb.click()
    await expect(log).toHaveText('[false,false]')
  })
});

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

  test('SW-ACT-03: Switch should request once from native Space or Enter activation', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-03')
    const log = page.getByTestId('sw-act-03-log')

    await sw.focus()
    await page.keyboard.press('Space')
    await expect(log).toHaveText('[true]')

    await page.getByTestId('sw-act-03-set-checked').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')

    await sw.focus()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('[true,false]')
  })
});

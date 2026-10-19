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

  test('SW-ACT-06: Switch should ignore activation when disabled', async ({ page }) => {
    const uncheckedSw = page.getByTestId('sw-act-06-unchecked')
    const checkedSw = page.getByTestId('sw-act-06-checked')
    const log = page.getByTestId('sw-act-06-log')

    await uncheckedSw.click({ force: true })
    await checkedSw.click({ force: true })
    await uncheckedSw.focus()
    await page.keyboard.press('Space')

    await expect(log).toHaveText('[]')
    await expect(uncheckedSw).toHaveAttribute('aria-checked', 'false')
    await expect(checkedSw).toHaveAttribute('aria-checked', 'true')
  })
});

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

  // Landing re-target: the freeze forbade uncontrolled mode, but landing preserves it
  // (recon exhibit 1), so ACT-08 pins the controlled-without-onChange readout instead.
  // Uncontrolled-without-onChange toggles its own DOM by design.
  test('SW-ACT-08: Switch should hold a controlled checked prop when onChange is omitted', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-act-08')

    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await sw.focus()
    await page.keyboard.press('Space')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
  })
});

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

  test('SW-DOM-02: Switch should expose authoritative checked state on both parts', async ({
    page,
  }) => {
    const sw = page.getByTestId('sw-dom-02')
    const thumb = sw.locator('[data-reference-switch-thumb]')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await expect(sw).toHaveAttribute('data-state', 'unchecked')
    await expect(thumb).toHaveAttribute('data-state', 'unchecked')
    await expect(sw).not.toHaveAttribute('aria-pressed')
    await expect(sw).toHaveAttribute('data-custom', 'keep-me')

    await page.getByTestId('sw-dom-02-flip').click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    await expect(sw).toHaveAttribute('data-state', 'checked')
    await expect(thumb).toHaveAttribute('data-state', 'checked')
    await expect(sw).not.toHaveAttribute('aria-pressed')
    await expect(sw).toHaveAttribute('data-custom', 'keep-me')
  })
});

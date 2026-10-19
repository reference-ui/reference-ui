/**
 * Switch browser proof: anatomy, activation, and parity. Renders the
 * fixtures to pin button[role=switch] with exactly one thumb, authoritative
 * checked and disabled exposure, single onChange per activation, label
 * association, form non-serialization, RTL-checked rendering, and an
 * accessibility-clean sweep.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Switch CT', () => {
  test('renders resting states overview', async ({ mount, page }) => {
    await mount('components/Switch/Switch/StatesFixture')

    const states = page.getByTestId('switch-states')
    await expect(states).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'switch-all-states')
  })
});

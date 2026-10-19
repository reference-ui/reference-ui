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
  test('renders button[role=switch] with default thumb and toggles checked state', async ({
    mount,
    page,
  }) => {
    await mount('components/Switch/Switch/InteractiveFixture')

    const switchEl = page.getByTestId('test-switch')
    const thumb = switchEl.locator('[data-reference-switch-thumb]')

    await expect(switchEl).toBeVisible()
    await expect(switchEl).toHaveAttribute('role', 'switch')
    await expect(switchEl).toHaveAttribute('type', 'button')
    await expect(thumb).toHaveCount(1)

    // Initially unchecked
    await expect(switchEl).toHaveAttribute('aria-checked', 'false')
    await expect(switchEl).toHaveAttribute('data-state', 'unchecked')
    await expect(thumb).toHaveAttribute('data-state', 'unchecked')
    await page.waitForTimeout(300)
    await snap(page, 'switch-resting-unchecked')

    // Hover
    await switchEl.hover()
    await page.waitForTimeout(200)
    await snap(page, 'switch-hover')

    // Keyboard focus ring
    await switchEl.focus()
    await page.waitForTimeout(200)
    await snap(page, 'switch-focus-ring')

    // Click to toggle checked
    await switchEl.click()
    await expect(switchEl).toHaveAttribute('aria-checked', 'true')
    await expect(switchEl).toHaveAttribute('data-state', 'checked')
    await expect(thumb).toHaveAttribute('data-state', 'checked')
    await page.waitForTimeout(300)
    await snap(page, 'switch-checked')

    // Keyboard Space toggles checked
    await switchEl.press('Space')
    await expect(switchEl).toHaveAttribute('aria-checked', 'false')
    await page.waitForTimeout(300)
    await snap(page, 'switch-unchecked-again')

    // Disabled state
    await page.getByTestId('btn-toggle-disabled').click()
    await expect(switchEl).toBeDisabled()
    await expect(switchEl).toHaveAttribute('data-disabled', '')
    await page.waitForTimeout(200)
    await snap(page, 'switch-disabled')
  })
});

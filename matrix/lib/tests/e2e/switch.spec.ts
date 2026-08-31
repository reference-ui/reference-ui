import { expect, test } from '@playwright/test'

test.describe('Switch Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/switch')
    await expect(page.getByTestId('switch-fixture-root')).toBeVisible()
  })

  test('SW-DOM-01, SW-DOM-02 & SW-DOM-03: Renders button[role=switch] with default thumb and toggles checked state', async ({
    page,
  }) => {
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

    // Click to toggle checked
    await switchEl.click()
    await expect(switchEl).toHaveAttribute('aria-checked', 'true')
    await expect(switchEl).toHaveAttribute('data-state', 'checked')
    await expect(thumb).toHaveAttribute('data-state', 'checked')

    // Keyboard Space toggles checked
    await switchEl.press('Space')
    await expect(switchEl).toHaveAttribute('aria-checked', 'false')

    // Disabled state
    await page.getByTestId('btn-toggle-disabled').click()
    await expect(switchEl).toBeDisabled()
    await expect(switchEl).toHaveAttribute('data-disabled', '')
  })
})

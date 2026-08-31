import { expect, test } from '@playwright/test'

test.describe('Popover Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/popover')
    await expect(page.getByTestId('popover-fixture-root')).toBeVisible()
  })

  test('PO-DOM-01 & PO-DOM-02: Toggles Popover open/closed and updates ARIA attributes', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-popover-trigger')
    const content = page.getByTestId('popover-content')

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)

    // Open popover
    await trigger.click()

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()
    await expect(content.getByTestId('popover-title')).toHaveText('Popover Header')

    // Close via Close button
    await page.getByTestId('btn-popover-close').click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(content).toHaveCount(0)
  })

  test('Escape key dismisses popover and returns focus to trigger', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-popover-trigger')
    const content = page.getByTestId('popover-content')

    await trigger.click()
    await expect(content).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

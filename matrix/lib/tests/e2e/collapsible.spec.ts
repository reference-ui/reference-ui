import { expect, test } from '@playwright/test'

test.describe('Collapsible Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/collapsible')
    await expect(page.getByTestId('collapsible-fixture-root')).toBeVisible()
  })

  test('CO-DOM-01, CO-DOM-02 & CO-DOM-04: Toggles Collapsible open/closed and updates ARIA attributes', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-collapsible-trigger')
    const content = page.getByTestId('collapsible-content')

    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)

    // Click to open
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('data-state', 'open')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-state', 'open')
    await expect(content.getByTestId('collapsible-text')).toHaveText('Detailed collapsible content.')

    const contentId = await content.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(trigger).toHaveAttribute('aria-controls', contentId!)

    // Click to close
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveAttribute('data-state', 'closed')
    await expect(content).toHaveCount(0)
  })
})

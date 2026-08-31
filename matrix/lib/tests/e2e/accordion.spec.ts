import { expect, test } from '@playwright/test'

test.describe('Accordion Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/accordion')
    await expect(page.getByTestId('accordion-fixture-root')).toBeVisible()
  })

  test('AC-DOM-01: Single expansion manages item visibility and arrow traversal', async ({
    page,
  }) => {
    const trigger1 = page.getByTestId('btn-trigger-1')
    const content1 = page.getByTestId('content-1')
    const trigger2 = page.getByTestId('btn-trigger-2')
    const content2 = page.getByTestId('content-2')

    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false')
    await expect(content2).toHaveCount(0)

    // Click trigger 2 -> opens item-2, closes item-1 through Presence + GSAP
    await trigger2.click()
    await expect(content1).toHaveAttribute('data-state', 'closed')
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()
    await expect(content1).toHaveCount(0)

    // Arrow keys navigate between triggers
    await trigger2.focus()
    await page.keyboard.press('ArrowUp')
    await expect(trigger1).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(trigger2).toBeFocused()
  })
})

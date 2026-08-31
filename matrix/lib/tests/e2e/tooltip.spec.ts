import { expect, test } from '@playwright/test'

test.describe('Tooltip Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tooltip')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()
  })

  test('TT-DOM-01 & TT-DOM-02: Slotted Trigger gains aria-describedby and shows Content on focus', async ({
    page,
  }) => {
    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')

    await expect(contentA).toHaveCount(0)

    // Focus on trigger -> immediately opens tooltip
    await btnA.focus()

    await expect(contentA).toBeVisible()
    await expect(contentA).toHaveAttribute('role', 'tooltip')
    await expect(contentA).toHaveText('Help text for Button A')

    const contentId = await contentA.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(btnA).toHaveAttribute('aria-describedby', contentId!)

    // Blur -> closes tooltip
    await page.getByTestId('btn-outside').focus()
    await expect(contentA).toHaveCount(0)
  })

  test('Hovering over trigger opens tooltip', async ({ page }) => {
    const btnB = page.getByTestId('btn-tooltip-b')
    const contentB = page.getByTestId('tooltip-content-b')

    await expect(contentB).toHaveCount(0)

    await btnB.hover()
    await expect(contentB).toBeVisible()
    await expect(contentB).toHaveText('Help text for Button B')
  })
})

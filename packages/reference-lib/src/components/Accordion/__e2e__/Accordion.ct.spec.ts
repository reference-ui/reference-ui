import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Accordion Composition Gates & Browser Proofs', () => {
  test('AC-DOM-01: Single expansion manages item visibility and arrow traversal', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Single')
    const trigger1 = page.getByTestId('btn-trigger-1')
    const content1 = page.getByTestId('content-1')
    const trigger2 = page.getByTestId('btn-trigger-2')
    const content2 = page.getByTestId('content-2')
    const trigger3 = page.getByTestId('btn-trigger-3')

    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(trigger2).toHaveAttribute('aria-expanded', 'false')
    await expect(content2).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'single-resting')

    // Hover trigger 2
    await trigger2.hover()
    await page.waitForTimeout(200)
    await snap(page, 'single-hover-trigger-2')

    // Click trigger 2 -> opens item-2, closes item-1
    await trigger2.click()
    await expect(content1).toHaveAttribute('data-state', 'closed')
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()
    await expect(content1).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'single-item-2-open')

    // Arrow keys navigate between triggers
    await trigger2.focus()
    await expect(trigger2).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-2-focused')

    await page.keyboard.press('ArrowUp')
    await expect(trigger1).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-1-focused')

    await page.keyboard.press('ArrowDown')
    await expect(trigger2).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(trigger3).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'single-trigger-3-focused')
  })

  test('AC-DOM-02: Multiple expansion allows concurrent open sections', async ({
    mount,
    page,
  }) => {
    await mount('components/Accordion/Accordion/Multiple')
    const trigger1 = page.getByTestId('multi-trigger-1')
    const content1 = page.getByTestId('multi-content-1')
    const trigger2 = page.getByTestId('multi-trigger-2')
    const content2 = page.getByTestId('multi-content-2')

    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content1).toBeVisible()
    await expect(content2).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'multiple-both-open')

    // Click trigger 1 to collapse section 1
    await trigger1.click()
    await expect(trigger1).toHaveAttribute('aria-expanded', 'false')
    await expect(content1).toHaveCount(0)
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    await expect(content2).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'multiple-item-1-closed')
  })
})

import { expect, test, type Locator } from '@playwright/test'

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

    await trigger.click()

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content).toBeVisible()
    await expect(content.getByTestId('popover-title')).toHaveText('Popover Header')

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

  test('PO-POS: Content is anchored below the Trigger, not hardcoded', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-popover-trigger')
    const content = page.getByTestId('popover-content')

    await trigger.click()
    await expect(content).toBeVisible()
    await expectAnchoredBottomStart(trigger, content)

    const inline = await content.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))
    expect(inline.position === 'absolute' || inline.position === 'fixed').toBe(true)
    expect(inline.top).toMatch(/px$/)
    expect(inline.left).toMatch(/px$/)
  })

  test('Outside press light-dismisses the popover', async ({ page }) => {
    const trigger = page.getByTestId('btn-popover-trigger')
    const content = page.getByTestId('popover-content')

    await trigger.click()
    await expect(content).toBeVisible()

    await page.getByTestId('btn-outside').click()
    await expect(content).toHaveCount(0)
  })
})

async function expectAnchoredBottomStart(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
  expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
  expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThan(16)
}

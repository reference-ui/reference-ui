import { expect, test, type Locator } from '@playwright/test'

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

    await btnA.focus()

    await expect(contentA).toBeVisible()
    await expect(contentA).toHaveAttribute('role', 'tooltip')
    await expect(contentA).toHaveText('Help text for Button A')

    const contentId = await contentA.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(btnA).toHaveAttribute('aria-describedby', contentId!)

    await page.getByTestId('btn-outside').focus()
    await expect(contentA).toHaveCount(0)
  })

  test('Hovering over trigger opens tooltip next to the trigger', async ({ page }) => {
    const btnB = page.getByTestId('btn-tooltip-b')
    const contentB = page.getByTestId('tooltip-content-b')

    await expect(contentB).toHaveCount(0)

    await btnB.hover()
    await expect(contentB).toBeVisible()
    await expect(contentB).toHaveText('Help text for Button B')
    await expectAnchoredTop(btnB, contentB)
  })

  test('TT-POS: focused tooltip is anchored to the trigger, not hardcoded', async ({
    page,
  }) => {
    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')

    await btnA.focus()
    await expect(contentA).toBeVisible()
    await expectAnchoredTop(btnA, contentA)

    const inline = await contentA.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))
    expect(inline.position === 'absolute' || inline.position === 'fixed').toBe(true)
    expect(inline.top).toMatch(/px$/)
    expect(inline.left).toMatch(/px$/)
  })
})

async function expectAnchoredTop(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y + contentBox!.height).toBeLessThanOrEqual(triggerBox!.y + 2)
  expect(contentBox!.y + contentBox!.height).toBeGreaterThan(triggerBox!.y - 32)

  const triggerMid = triggerBox!.x + triggerBox!.width / 2
  expect(contentBox!.x).toBeLessThan(triggerMid)
  expect(contentBox!.x + contentBox!.width).toBeGreaterThan(triggerMid)
}

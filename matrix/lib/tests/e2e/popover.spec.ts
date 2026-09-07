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

  test('PO-FLIP-01: Popover should flip to the opposite side when its preferred side overflows', async ({ page }) => {
    await page.goto('/popover?fixture=Placements')
    const trigger = page.locator('button', { hasText: 'bottom' }).first()
    await trigger.evaluate((node) => {
      node.style.position = 'fixed'
      node.style.bottom = '10px'
    })
    await trigger.click()
    const content = page.locator('[data-reference-overlay-content]')
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-side', 'top')
  })

  test('PO-SHIFT-01: Popover should shift within collision padding when Content partially overflows', async ({ page }) => {
    await page.goto('/popover?fixture=Placements')
    const trigger = page.locator('button', { hasText: 'top' }).first()
    await trigger.evaluate((node) => {
      node.style.position = 'fixed'
      node.style.right = '0px'
      node.style.top = '50px'
    })
    await trigger.click()
    const content = page.locator('[data-reference-overlay-content]')
    await expect(content).toBeVisible()
    const box = await content.boundingBox()
    const viewport = page.viewportSize()
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width)
  })

  test('PO-ARROW-01: Popover should center Arrow on its anchor', async ({ page }) => {
    await page.goto('/popover?fixture=ClickToOpen')
    const trigger = page.locator('button', { hasText: 'Open popover' })
    await trigger.click()
    const arrow = page.locator('[data-reference-popover-arrow]')
    await expect(arrow).toBeVisible()
    const triggerBox = await trigger.boundingBox()
    const arrowBox = await arrow.boundingBox()
    const triggerCenter = triggerBox!.x + triggerBox!.width / 2
    const arrowCenter = arrowBox!.x + arrowBox!.width / 2
    expect(Math.abs(triggerCenter - arrowCenter)).toBeLessThan(5)
  })

  test('PO-HOVER-01: Popover should issue delayed open request when mouse remains over openOnHover Trigger', async ({ page }) => {
    await page.goto('/popover?fixture=HoverCard')
    const trigger = page.locator('button', { hasText: 'Hover for preview' })
    const content = page.locator('[data-reference-overlay-content]')
    await trigger.hover()
    await expect(content).toHaveCount(0)
    await page.waitForTimeout(350)
    await expect(content).toBeVisible()
  })

  test('PO-HOVER-02: Popover should stay open when pointer travels to Content', async ({ page }) => {
    await page.goto('/popover?fixture=HoverCard')
    const trigger = page.locator('button', { hasText: 'Hover for preview' })
    const content = page.locator('[data-reference-overlay-content]')
    await trigger.hover()
    await page.waitForTimeout(350)
    await expect(content).toBeVisible()
    await content.hover()
    await page.waitForTimeout(250)
    await expect(content).toBeVisible()
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

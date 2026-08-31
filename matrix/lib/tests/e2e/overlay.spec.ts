import { expect, test, type Locator } from '@playwright/test'

test.describe('Overlay Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overlay')
    await expect(page.getByTestId('overlay-fixture-root')).toBeVisible()
  })

  test('OV-DOM-01 & OV-DOM-05: Renders no portal content initially, renders Backdrop and Content upon open', async ({
    page,
  }) => {
    const backdrop = page.getByTestId('overlay-backdrop')
    const content = page.getByTestId('overlay-content')

    await expect(backdrop).toHaveCount(0)
    await expect(content).toHaveCount(0)

    await page.getByTestId('btn-open-overlay').click()

    await expect(backdrop).toBeVisible()
    await expect(content).toBeVisible()
    await expect(content.getByTestId('overlay-title')).toHaveText('Dialog Title')

    await page.getByTestId('btn-close-overlay').click()
    await expect(content).toHaveCount(0)
  })

  test('Escape key dismisses the overlay', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const content = page.getByTestId('overlay-content')
    await expect(content).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
  })

  test('Clicking backdrop dismisses the overlay', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const content = page.getByTestId('overlay-content')
    const backdrop = page.getByTestId('overlay-backdrop')
    await expect(content).toBeVisible()

    await backdrop.click({ position: { x: 10, y: 10 } })
    await expect(content).toHaveCount(0)
  })

  test('Focus is trapped inside overlay content while open', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const firstAction = page.getByTestId('btn-inside-first')
    const closeBtn = page.getByTestId('btn-close-overlay')

    await expect(firstAction).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(closeBtn).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(firstAction).toBeFocused()
  })

  test('OV-POS-01: Unbound Content writes no position/top/left', async ({ page }) => {
    await page.getByTestId('btn-open-unbound').click()
    const content = page.getByTestId('overlay-unbound-content')
    await expect(content).toBeVisible()

    const inline = await content.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))

    expect(inline.position).toBe('')
    expect(inline.top).toBe('')
    expect(inline.left).toBe('')
  })

  test('OV-POS-01 dialog: isolating Trigger does not overwrite application centering', async ({
    page,
  }) => {
    await page.getByTestId('btn-open-overlay').click()
    const content = page.getByTestId('overlay-content')
    await expect(content).toBeVisible()

    const inline = await content.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))

    expect(inline.position).toBe('fixed')
    expect(inline.top).toBe('50%')
    expect(inline.left).toBe('50%')
  })

  test('OV-TRG-02: isolation={false} Trigger is the Floating UI reference', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-open-anchored')
    const content = page.getByTestId('overlay-anchored-content')

    await expect(content).toHaveCount(0)
    await trigger.click()
    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await expectAnchoredBottomStart(trigger, content)
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

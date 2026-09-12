import { test, expect, snap } from '../../../../playwright/ct'

test('popover opens on trigger click and closes on outside click', async ({ mount, page }) => {
  const component = await mount('components/Popover/Popover/ClickToOpen')
  const trigger = component.getByRole('button', { name: 'Open popover' })
  const content = page.getByText('Popover title')

  await expect(content).not.toBeVisible()
  await page.waitForTimeout(600)
  await snap(page, 'click-resting')

  await trigger.click()
  await expect(content).toBeVisible()
  await page.waitForTimeout(1000)
  await snap(page, 'click-open')

  await page.mouse.click(10, 10)
  await expect(content).not.toBeVisible()
  await page.waitForTimeout(600)
  await snap(page, 'click-dismissed')
})

test('popover closes on escape key', async ({ mount, page }) => {
  const component = await mount('components/Popover/Popover/ClickToOpen')
  const trigger = component.getByRole('button', { name: 'Open popover' })
  const content = page.getByText('Popover title')

  await page.waitForTimeout(600)
  await trigger.click()
  await expect(content).toBeVisible()
  await page.waitForTimeout(1000)
  await snap(page, 'escape-open')

  await page.keyboard.press('Escape')
  await expect(content).not.toBeVisible()
  await page.waitForTimeout(600)
  await snap(page, 'escape-dismissed')
})

test('hover popover opens on pointer enter and dismisses on leave', async ({ mount, page }) => {
  const component = await mount('components/Popover/Popover/HoverCard')
  const trigger = component.getByRole('button', { name: 'Hover for preview' })
  const content = page.getByText('Hover-opened popover with grace area')

  await page.waitForTimeout(600)
  await snap(page, 'hover-resting')

  await trigger.hover()
  await expect(content).toBeVisible()
  await page.waitForTimeout(1000)
  await snap(page, 'hover-open')

  await page.mouse.move(10, 10)
  await expect(content).not.toBeVisible()
  await page.waitForTimeout(600)
  await snap(page, 'hover-dismissed')
})

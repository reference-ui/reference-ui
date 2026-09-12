import { test, expect, snap } from '../../../../playwright/ct'

test('tooltip opens on hover and closes on pointer leave', async ({ mount, page }) => {
  const component = await mount('components/Tooltip/Tooltip/HoverTrigger')
  const trigger = component.getByRole('button', { name: 'Hover tooltip trigger' })
  const content = page.getByText('Helpful tooltip information')

  await expect(content).not.toBeVisible()
  await snap(page, 'hover-resting')

  await trigger.hover()
  await expect(content).toBeVisible()
  await page.waitForTimeout(300)
  await snap(page, 'hover-open')

  await page.mouse.move(10, 10)
  await expect(content).not.toBeVisible()
  await page.waitForTimeout(200)
  await snap(page, 'hover-dismissed')
})

test('tooltip opens on keyboard focus and closes on Escape', async ({ mount, page }) => {
  const component = await mount('components/Tooltip/Tooltip/KeyboardFocus')
  const trigger = component.getByRole('button', { name: 'Keyboard focus trigger' })
  const content = page.getByText('Appears on keyboard focus')

  await expect(content).not.toBeVisible()
  await snap(page, 'focus-resting')

  await trigger.focus()
  await expect(content).toBeVisible()
  await page.waitForTimeout(300)
  await snap(page, 'focus-open')

  await page.keyboard.press('Escape')
  await expect(content).not.toBeVisible()
  await page.waitForTimeout(200)
  await snap(page, 'focus-dismissed')
})

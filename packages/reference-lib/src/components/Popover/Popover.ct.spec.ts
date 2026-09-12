import { test, expect } from '@playwright/test'

test('popover opens on trigger click', async ({ mount, page }) => {
  const component = await mount('components/Popover/Popover/ClickToOpen')
  await component.getByRole('button', { name: 'Open popover' }).click()
  await expect(page.getByText('Popover title')).toBeVisible()
})

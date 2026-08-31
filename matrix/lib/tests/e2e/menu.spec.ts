import { expect, test } from '@playwright/test'

test.describe('Menu Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByTestId('menu-fixture-root')).toBeVisible()
  })

  test('MN-DOM-01: Renders menu trigger, opens content, selects item and closes', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-menu-trigger')
    const content = page.getByTestId('menu-content')
    const display = page.getByTestId('menu-action-display')

    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await expect(content).toHaveCount(0)

    // Click trigger -> opens menu
    await trigger.click()
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('role', 'menu')

    const itemEdit = page.getByTestId('menu-item-edit')
    await expect(itemEdit).toBeVisible()
    await expect(itemEdit).toHaveAttribute('role', 'menuitem')

    // Click edit -> selects Edit and closes menu
    await itemEdit.click()
    await expect(content).toHaveCount(0)
    await expect(display).toHaveText('Last Action: Edit')
  })
})

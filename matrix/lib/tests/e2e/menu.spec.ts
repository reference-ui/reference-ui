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
    const itemBox = await itemEdit.boundingBox()
    expect(itemBox?.height).toBe(34)

    // Click edit -> selects Edit and closes menu
    await itemEdit.click()
    await expect(content).toHaveCount(0)
    await expect(display).toHaveText('Last Action: Edit')
  })

  test('MN-DOM-02: Keyboard roving focus highlights MenuItem with solid background and no outline ring', async ({
    page,
  }) => {
    const trigger = page.getByTestId('btn-menu-trigger')
    const content = page.getByTestId('menu-content')

    await trigger.click()
    await expect(content).toBeVisible()

    const itemEdit = page.getByTestId('menu-item-edit')
    await expect(itemEdit).toBeVisible()

    // Focus first item
    await itemEdit.focus()
    await expect(itemEdit).toBeFocused()

    const itemStyles = await itemEdit.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        backgroundColor: s.backgroundColor,
        color: s.color,
      }
    })

    // No outline ring
    const isOutlineAbsent =
      itemStyles.outlineStyle === 'none' ||
      itemStyles.outlineWidth === '0px' ||
      itemStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      itemStyles.outlineColor === 'transparent' ||
      itemStyles.outlineColor.includes('/ 0)')

    expect(isOutlineAbsent).toBe(true)

    // Solid background (not transparent)
    expect(itemStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(itemStyles.backgroundColor).not.toBe('transparent')
    expect(itemStyles.backgroundColor.includes('/ 0)')).toBe(false)
  })
})

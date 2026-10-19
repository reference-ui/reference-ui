/**
 * Menu browser proofs: composition gates plus the root-level parity
 * re-targets across DOM, focus, typeahead, and action rows. Mounts the
 * story fixtures and asserts levels, roving, and one-selection
 * discipline in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

async function centerOf(locator: {
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>
}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('expected a bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('Menu Composition Gates & Browser Proofs', () => {
  test('MN-DOM-01: Renders menu trigger, opens content, selects item and closes', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Basic')
    const trigger = page.getByTestId('btn-menu-trigger')
    const content = page.getByTestId('menu-content')
    const display = page.getByTestId('menu-action-display')

    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await expect(content).toHaveCount(0)

    await page.waitForTimeout(300)
    await snap(page, 'resting-closed')

    // Hover trigger
    await trigger.hover()
    await page.waitForTimeout(200)
    await snap(page, 'hover-trigger')

    // Click trigger -> opens menu
    await trigger.click()
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('role', 'menu')

    const itemEdit = page.getByTestId('menu-item-edit')
    await expect(itemEdit).toBeVisible()
    await expect(itemEdit).toHaveAttribute('role', 'menuitem')
    const itemBox = await itemEdit.boundingBox()
    expect(itemBox?.height).toBe(34)

    await page.waitForTimeout(300)
    await snap(page, 'menu-opened')

    // Hover edit item
    await itemEdit.hover()
    await page.waitForTimeout(200)
    await snap(page, 'hover-item')

    // Click edit -> selects Edit and closes menu
    await itemEdit.click()
    await expect(content).toHaveCount(0)
    await expect(display).toHaveText('Last Action: Edit')

    await page.waitForTimeout(300)
    await snap(page, 'item-selected-closed')
  })
})

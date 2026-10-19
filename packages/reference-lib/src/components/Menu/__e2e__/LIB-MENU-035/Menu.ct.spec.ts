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

test.describe('Menu parity (root-level re-targets)', () => {

  test('MN-FOCUS-03: Vertical Menu provides complete wrapped roving focus over enabled commands', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const content = page.getByTestId('menu-content')
    const itemEdit = page.getByTestId('menu-item-edit')
    const itemDup = page.getByTestId('menu-item-duplicate')
    await itemEdit.focus()

    await page.keyboard.press('ArrowDown')
    await expect(itemDup).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(itemEdit).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(itemDup).toBeFocused()

    await page.keyboard.press('Home')
    await expect(itemEdit).toBeFocused()
    await page.keyboard.press('End')
    await expect(itemDup).toBeFocused()

    await expect(content.locator('[tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: None')
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true')
  })
})

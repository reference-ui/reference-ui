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

test.describe('Menu keyboard, choice items, and adjacent dismiss', () => {
  test('MN-FOCUS-07: Menu moves content-focused arrows/Home/End to edge items', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const content = page.getByTestId('menu-sub-root')
    const first = page.getByTestId('menu-sub-item-new')
    const last = page.getByTestId('menu-sub-trigger-omitted')
    await expect(content).toBeVisible()
    await expect(content).toBeFocused()

    // ArrowDown lands on the FIRST item, never skipping to the second.
    await page.keyboard.press('ArrowDown')
    await expect(first).toBeFocused()

    await content.focus()
    await page.keyboard.press('End')
    await expect(last).toBeFocused()

    await content.focus()
    await page.keyboard.press('Home')
    await expect(first).toBeFocused()

    await content.focus()
    await page.keyboard.press('ArrowUp')
    await expect(last).toBeFocused()

    // Nothing selected, nothing dismissed by navigation alone.
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: None')
    await expect(content).toBeVisible()
  })
})

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

  test('MN-FOCUS-07-sub: Submenu content moves container keys to its own edge items', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    const subContent = page.getByTestId('menu-sub-content')
    const first = page.getByTestId('menu-sub-item-email')
    const last = page.getByTestId('menu-sub-item-copy')
    await expect(subContent).toBeVisible()

    await subContent.focus()
    await page.keyboard.press('ArrowDown')
    await expect(first).toBeFocused()

    await subContent.focus()
    await page.keyboard.press('End')
    await expect(last).toBeFocused()

    await subContent.focus()
    await page.keyboard.press('Home')
    await expect(first).toBeFocused()

    await subContent.focus()
    await page.keyboard.press('ArrowUp')
    await expect(last).toBeFocused()

    await expect(subContent).toBeVisible()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()
  })
})

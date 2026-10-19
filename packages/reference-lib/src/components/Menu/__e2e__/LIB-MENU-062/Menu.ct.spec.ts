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

test.describe('Menu Nested Submenus (FEATURES #1)', () => {

  test('MN-FOCUS-06: Roving onto a closed trigger does not open it', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await page.getByTestId('menu-sub-item-new').focus()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-sub-trigger')).toBeFocused()
    await expect(page.getByTestId('menu-sub-trigger')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: ')
  })
})

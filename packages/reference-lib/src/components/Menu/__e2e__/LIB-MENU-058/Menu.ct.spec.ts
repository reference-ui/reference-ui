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

  test('MN-SUBKEY-05: Escape closes one level at a time up the tree', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    const rootTrigger = page.getByTestId('btn-sub-trigger')
    await rootTrigger.click()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-deep')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-content-l2')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-trigger-l2')).toBeFocused()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-sub-trigger')).toBeFocused()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
    await expect(rootTrigger).toBeFocused()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss,share:onDismiss'
    )
  })
})

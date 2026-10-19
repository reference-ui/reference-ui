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

  test('MN-ACT-03: Menu lets consumer handlers cancel selection and dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-cancel-trigger').click()

    await page.getByTestId('menu-item-native-cancel').click()
    await expect(page.getByTestId('menu-cancel-display')).toHaveText('Cancel Action: None')
    await expect(page.getByTestId('menu-content-cancel')).toBeVisible()

    await page.getByTestId('menu-item-select-cancel').click()
    await expect(page.getByTestId('menu-cancel-display')).toHaveText('Cancel Action: SelectCancel')
    await expect(page.getByTestId('menu-content-cancel')).toBeVisible()

    const nativeItem = page.getByTestId('menu-item-native-cancel')
    await nativeItem.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-content-cancel')).toBeVisible()

    const selectItem = page.getByTestId('menu-item-select-cancel')
    await selectItem.focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-content-cancel')).toBeVisible()
  })
})

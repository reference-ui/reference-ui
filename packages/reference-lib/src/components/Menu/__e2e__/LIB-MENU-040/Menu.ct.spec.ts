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

  test('MN-ACT-02: Menu invokes one item selection for either Enter or Space with keyboard metadata', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await trigger.click()
    const itemEdit = page.getByTestId('menu-item-edit')
    await itemEdit.focus()
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: Edit')
    await expect(page.getByTestId('menu-select-event')).toHaveText('Select Event: keydown:Enter:false')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)

    await trigger.click()
    // Settle the pointer-open entry focus before programmatic focus: the
    // frame-late container focus would otherwise steal it back under load.
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-content')).toBeFocused()
    const itemDup = page.getByTestId('menu-item-duplicate')
    await itemDup.focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: Duplicate')
    await expect(page.getByTestId('menu-select-event')).toHaveText('Select Event: keydown: :false')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
  })
})

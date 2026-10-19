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

  test('MN-CLOSE-11: Adjacent trigger press closes the open menu before opening its own', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Adjacent')
    const fileTrigger = page.getByTestId('btn-file-trigger')
    const editTrigger = page.getByTestId('btn-edit-trigger')
    const fileRoot = page.getByTestId('menu-file-root')
    const editRoot = page.getByTestId('menu-edit-root')

    await fileTrigger.click()
    await expect(fileRoot).toBeVisible()
    await expect(editRoot).toHaveCount(0)

    // Baseline dismiss, no Menubar: File closes, Edit opens, never both.
    await editTrigger.click()
    await expect(fileRoot).toHaveCount(0)
    await expect(editRoot).toBeVisible()
    await expect(page.getByTestId('menu-adjacent-file-logs')).toHaveText('File Logs: true,false')
    await expect(page.getByTestId('menu-adjacent-edit-logs')).toHaveText('Edit Logs: true')

    // Symmetric the other way.
    await fileTrigger.click()
    await expect(editRoot).toHaveCount(0)
    await expect(fileRoot).toBeVisible()

    // Selection still dismisses exactly its own tree.
    await page.getByTestId('menu-file-new').click()
    await expect(fileRoot).toHaveCount(0)
    await expect(editRoot).toHaveCount(0)
    await expect(page.getByTestId('menu-adjacent-action')).toHaveText('Adjacent Action: New')
    await expect(fileTrigger).toBeFocused()
  })
})

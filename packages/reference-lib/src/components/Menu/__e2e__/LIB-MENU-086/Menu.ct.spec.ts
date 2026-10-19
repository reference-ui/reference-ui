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

test.describe('Menu controlled submenu keyboard completions', () => {

  test('MN-TYPE-03: Typeahead buffers reset and scope as submenu ownership changes', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()

    // Root prefix uses the root buffer.
    await page.getByTestId('menu-sub-item-new').focus()
    await page.keyboard.press('n')
    await expect(page.getByTestId('menu-sub-item-new')).toBeFocused()

    // Submenu typing uses only the submenu buffer (each level owns a root).
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await page.keyboard.press('c')
    await expect(page.getByTestId('menu-sub-item-copy')).toBeFocused()

    // Close and continue at the restored trigger with a fresh root buffer.
    await page.keyboard.press('Escape')
    const trigger = page.getByTestId('menu-sub-trigger')
    await expect(trigger).toBeFocused()
    await page.waitForTimeout(1200)
    await page.keyboard.press('o')
    await expect(page.getByTestId('menu-sub-trigger-omitted')).toBeFocused()
  })
})

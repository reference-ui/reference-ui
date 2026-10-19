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

  test('MN-FOCUS-05: Menu leaves focus at its source when no enabled entry item exists', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const disabledTrigger = page.getByTestId('btn-disabled-trigger')
    await disabledTrigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-content-disabled')).toBeVisible()
    await expect(disabledTrigger).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(disabledTrigger).toBeFocused()
    await page.getByTestId('disabled-item-1').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content-disabled')).toHaveCount(0)
    await expect(disabledTrigger).toBeFocused()

    const emptyTrigger = page.getByTestId('btn-empty-trigger')
    await emptyTrigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-content-empty')).toBeVisible()
    await expect(emptyTrigger).toBeFocused()
    await emptyTrigger.click()
    await expect(page.getByTestId('menu-content-empty')).toHaveCount(0)
  })
})

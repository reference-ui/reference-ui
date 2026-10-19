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

test.describe('Menu composition gates', () => {
  test('MN-COMP-01: MenuButton composes Button, Popover, and Menu with one authority', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')

    // Pointer open selects and dismisses with trigger-relative restoration.
    await trigger.click()
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await page.getByTestId('menu-item-edit').click()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: Edit')
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true,false')
    await expect(trigger).toBeFocused()

    // ArrowUp entry lands on the last enabled item; Escape restores once.
    await trigger.focus()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('menu-item-duplicate')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(trigger).toBeFocused()

    // Tab continues relative to the source trigger, not portal order.
    await trigger.click()
    await page.getByTestId('menu-item-edit').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(page.getByTestId('btn-cancel-trigger')).toBeFocused()
  })
})

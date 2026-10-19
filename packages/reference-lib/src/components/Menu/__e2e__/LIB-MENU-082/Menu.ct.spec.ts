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
  test('MN-SUBKEY-04: RTL mirrors submenu open and close arrows without changing activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuRtl')
    await page.getByTestId('btn-rtl-trigger').click()
    await expect(page.getByTestId('menu-rtl-root')).toBeFocused()
    const trigger = page.getByTestId('menu-rtl-trigger')
    const logs = page.getByTestId('menu-rtl-logs')
    await trigger.focus()

    // Mirrored open: Left opens in RTL.
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('menu-rtl-content')).toBeVisible()
    await expect(logs).toHaveText('RTL Logs: share:onOpen')
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()

    // Vertical roving matches LTR.
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('menu-rtl-item-copy')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()

    // Mirrored close: Right closes in RTL and restores the trigger.
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-rtl-content')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(logs).toHaveText('RTL Logs: share:onOpen,share:onDismiss')

    // Activation matches LTR.
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-rtl-content')).toBeVisible()
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-rtl-content')).toHaveCount(0)

    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-rtl-content')).toBeVisible()
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()
  })
})

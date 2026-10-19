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

  test('MN-COMP-03: Two-level submenu ownership across keyboard, intent, and dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    const rootTrigger = page.getByTestId('btn-sub-trigger')
    await rootTrigger.click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()

    // Two keyboard levels open with mounted focus targets. The entry-focus
    // effect lands on a frame: settle it before moving to the next trigger
    // or it steals focus back after our programmatic focus under load.
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-deep')).toBeFocused()

    // Intent travel keeps the deep level open without extra requests.
    const l2Trigger = page.getByTestId('menu-sub-trigger-l2')
    const l2Content = page.getByTestId('menu-sub-content-l2')
    const from = await centerOf(l2Trigger)
    const to = await centerOf(l2Content)
    await page.mouse.move(from.x, from.y)
    for (let step = 1; step <= 6; step++) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * step) / 6,
        from.y + ((to.y - from.y) * step) / 6
      )
    }
    await page.waitForTimeout(450)
    await expect(l2Content).toBeVisible()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen'
    )

    // Deep selection unwinds deepest-first with one root restoration.
    await page.getByTestId('menu-sub-item-deep').click()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss,share:onDismiss'
    )
    await expect(page.getByTestId('menu-sub-root-logs')).toHaveText('Sub Root Logs: true,false')
    await expect(rootTrigger).toBeFocused()

    // Mirrored ownership holds under RTL.
    await mount('components/Menu/Menu/SubmenuRtl')
    await page.getByTestId('btn-rtl-trigger').click()
    await expect(page.getByTestId('menu-rtl-root')).toBeFocused()
    await page.getByTestId('menu-rtl-trigger').focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('menu-rtl-item-email')).toBeFocused()
    await page.getByTestId('menu-rtl-item-email').click()
    await expect(page.getByTestId('menu-rtl-action')).toHaveText('RTL Action: Email')
    await expect(page.getByTestId('btn-rtl-trigger')).toBeFocused()
  })
})

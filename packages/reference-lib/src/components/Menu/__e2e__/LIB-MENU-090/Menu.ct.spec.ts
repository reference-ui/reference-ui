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

test.describe('Menu tree dismissal completions', () => {

  test('MN-CLOSE-07: One layer per root popup and open submenu, one request per event', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()
    await page.getByTestId('menu-sub-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-email')).toBeFocused()
    await page.getByTestId('menu-sub-trigger-l2').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-item-deep')).toBeFocused()

    // One Escape reaches only the top affected level, exactly once.
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss'
    )
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()
    await expect(page.getByTestId('menu-sub-root-logs')).toHaveText('Sub Root Logs: true')

    // One outside press unwinds deepest-first with a single root request.
    await page.getByTestId('sub-outside').click()
    await expect(page.getByTestId('menu-sub-logs')).toHaveText(
      'Sub Logs: share:onOpen,more:onOpen,more:onDismiss,share:onDismiss'
    )
    await expect(page.getByTestId('menu-sub-root-logs')).toHaveText('Sub Root Logs: true,false')
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
  })
})

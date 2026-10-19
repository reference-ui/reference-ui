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

  test('MN-CLOSE-06: Removing a submenu trigger before close falls back to a live item', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-remove-trigger').click()
    await expect(page.getByTestId('menu-probe-remove-root')).toBeFocused()
    await page.getByTestId('probe-remove-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-remove-item')).toBeFocused()

    // Synthetic removal click: a real press would outside-dismiss first.
    await page
      .getByTestId('btn-probe-remove-hide')
      .evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('probe-remove-trigger')).toHaveCount(0)

    await page.getByTestId('probe-remove-item').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-probe-remove-logs')).toHaveText(
      'Remove Logs: remove:onOpen,remove:onDismiss'
    )
    await expect(page.getByTestId('probe-remove-content')).toHaveCount(0)
    await expect(page.getByTestId('probe-remove-first')).toBeFocused()
    await expect(page.getByTestId('menu-probe-remove-root')).toBeVisible()
  })
})

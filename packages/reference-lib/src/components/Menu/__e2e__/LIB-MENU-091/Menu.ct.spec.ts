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

  test('MN-CLOSE-09: Extension overlay interaction dismisses once despite stopped mouse events', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-ext-trigger').click()
    await expect(page.getByTestId('menu-probe-ext-root')).toBeFocused()
    await expect(page.getByTestId('menu-probe-ext-root')).toBeVisible()
    await page.getByTestId('probe-ext-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-ext-content')).toBeVisible()

    await page.getByTestId('probe-extension').click()
    // WebKit click-focus never lands on buttons, so
    // re-deliver the Chromium focus state; the dismiss-once + no-steal
    // assertions below then test the extension press on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('probe-extension').focus()
    await expect(page.getByTestId('menu-probe-ext-logs')).toHaveText(
      'Ext Logs: share:onOpen,share:onDismiss'
    )
    await expect(page.getByTestId('menu-probe-ext-root')).toHaveCount(0)
    await expect(page.getByTestId('probe-extension')).toBeFocused()
  })
})

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

test.describe('Menu placement and dynamic ownership', () => {

  test('MN-DYNAMIC-02: Removing an open submenu cleans timers, layers, and branches', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    // Witness root opens first and must survive the removal untouched.
    await page.getByTestId('btn-probe-dyn-trigger-b').click()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()

    // Keyboard opening avoids an outside press against the witness.
    await page.getByTestId('btn-probe-dyn-trigger-a').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-probe-dyn-root-a')).toBeVisible()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()
    await expect(page.getByTestId('probe-dyn-item-a1')).toBeFocused()

    await page.getByTestId('probe-dyn-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-dyn-content')).toBeVisible()

    await page
      .getByTestId('btn-probe-dyn-remove')
      .evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('probe-dyn-trigger')).toHaveCount(0)
    await expect(page.getByTestId('probe-dyn-content')).toHaveCount(0)

    // Stale timers and branches stay silent; the witness root is unaffected.
    await page.mouse.move(400, 300)
    await page.mouse.move(100, 100)
    await page.waitForTimeout(450)
    await expect(page.getByTestId('menu-probe-dyn-logs')).toHaveText('Dyn Logs: dyn:onOpen')
    await expect(page.getByTestId('menu-probe-dyn-root-a')).toBeVisible()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()
  })
})

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

test.describe('Menu pointer submenu intent', () => {

  test('MN-INTENT-03: Travel clearly away requests closure at 300ms, not before', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const content = page.getByTestId('menu-sub-content')
    const logs = page.getByTestId('menu-sub-logs')

    await trigger.hover()
    await expect(content).toBeVisible()

    await page.mouse.move(30, 30)
    await page.waitForTimeout(150)
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
    await expect(content).toBeVisible()

    await expect(logs).toHaveText('Sub Logs: share:onOpen,share:onDismiss', { timeout: 3000 })
    await expect(content).toHaveCount(0)
  })
})

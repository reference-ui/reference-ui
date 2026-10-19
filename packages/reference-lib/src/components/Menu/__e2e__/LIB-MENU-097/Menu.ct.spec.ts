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

  test('MN-INTENT-06: Grace geometry follows the resolved collision side', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-flip-trigger').click()
    const trigger = page.getByTestId('probe-flip-trigger')
    const content = page.getByTestId('probe-flip-content')
    const logs = page.getByTestId('menu-probe-flip-logs')

    await trigger.hover()
    await expect(content).toBeVisible()
    await expect(content).toHaveAttribute('data-side', 'left')

    // Toward travel on the flipped side keeps the level open.
    const from = await centerOf(trigger)
    const to = await centerOf(content)
    await page.mouse.move(from.x, from.y)
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * step) / 8,
        from.y + ((to.y - from.y) * step) / 8
      )
    }
    await page.waitForTimeout(450)
    await expect(content).toBeVisible()
    await expect(logs).toHaveText('Flip Logs: flip:onOpen')

    // Away travel on the flipped side requests close once.
    await page.mouse.move(30, 400)
    await expect(logs).toHaveText('Flip Logs: flip:onOpen,flip:onDismiss', { timeout: 3000 })
    await expect(content).toHaveCount(0)
  })
})

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

  test('MN-INTENT-04: Returning through the submenu path duplicates no callbacks', async ({
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

    // Trigger -> content -> same trigger: associated level stays open, silent.
    const triggerPoint = await centerOf(trigger)
    const contentPoint = await centerOf(content)
    await page.mouse.move(contentPoint.x, contentPoint.y)
    await page.mouse.move(triggerPoint.x, triggerPoint.y)
    await page.waitForTimeout(450)
    await expect(content).toBeVisible()
    await expect(logs).toHaveText('Sub Logs: share:onOpen')

    // Deeper: return to the root trigger closes only the unassociated level.
    await page.getByTestId('menu-sub-trigger-l2').hover()
    await expect(page.getByTestId('menu-sub-content-l2')).toBeVisible()
    await page.mouse.move(triggerPoint.x, triggerPoint.y)
    await expect(logs).toHaveText('Sub Logs: share:onOpen,more:onOpen,more:onDismiss', {
      timeout: 3000,
    })
    await expect(page.getByTestId('menu-sub-content-l2')).toHaveCount(0)
    await expect(content).toBeVisible()
  })
})

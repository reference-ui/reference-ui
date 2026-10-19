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

  test('MN-INTENT-05: Switching to an enabled trigger closes the old level and opens the new one', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const logs = page.getByTestId('menu-sub-logs')

    await trigger.hover()
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await page.getByTestId('menu-sub-trigger-omitted').hover()

    await expect(logs).toContainText('share:onDismiss', { timeout: 3000 })
    await expect(logs).toContainText('omitted:onOpen', { timeout: 3000 })
    const text = await logs.textContent()
    expect(text?.split('share:onDismiss').length).toBe(2)
    expect(text?.split('omitted:onOpen').length).toBe(2)
    await expect(page.getByTestId('menu-sub-content')).toHaveCount(0)
  })
})

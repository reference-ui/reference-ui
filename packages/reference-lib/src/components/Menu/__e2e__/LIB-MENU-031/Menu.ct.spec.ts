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

test.describe('Menu parity (root-level re-targets)', () => {

  test('MN-DOM-07: Menu generates collision-free stable IDs across roots', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const firstId = await page.getByTestId('menu-content').getAttribute('id')
    expect(firstId).toBeTruthy()
    // Each trigger controls its own Popover layer, which owns its Menu.
    const firstControls = await page.getByTestId('btn-menu-trigger').getAttribute('aria-controls')
    expect(firstControls).toBeTruthy()
    await expect(page.locator(`[id="${firstControls}"]`).getByTestId('menu-content')).toHaveCount(1)

    await page.getByTestId('btn-second-trigger').click()
    const secondId = await page.getByTestId('menu-content-second').getAttribute('id')
    expect(secondId).toBeTruthy()
    expect(secondId).not.toBe(firstId)
    const secondControls = await page.getByTestId('btn-second-trigger').getAttribute('aria-controls')
    expect(secondControls).toBeTruthy()
    expect(secondControls).not.toBe(firstControls)
    await expect(page.locator(`[id="${secondControls}"]`).getByTestId('menu-content-second')).toHaveCount(1)

    await page.getByTestId('btn-menu-trigger').click()
    expect(await page.getByTestId('menu-content').getAttribute('id')).toBe(firstId)
    expect(await page.locator(`[id="${firstId}"]`).count()).toBe(1)
  })
})

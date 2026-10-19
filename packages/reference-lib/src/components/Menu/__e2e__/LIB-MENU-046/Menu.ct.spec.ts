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

  test('MN-CLOSE-01: Menu unwinds on a press outside the root subtree', async ({ mount, page }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    await expect(page.getByTestId('menu-content')).toBeVisible()

    await page.getByTestId('tab-before').click()
    // WebKit click-focus never lands on buttons, so
    // re-deliver the Chromium focus state; the dismiss + no-steal assertions
    // below then test the outside press on every engine.
    if (engineOf() === 'webkit') await page.getByTestId('tab-before').focus()
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true,false')
    await expect(page.getByTestId('tab-before')).toBeFocused()
  })
})

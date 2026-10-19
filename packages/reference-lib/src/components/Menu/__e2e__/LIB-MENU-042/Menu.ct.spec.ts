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

  test('MN-ACT-06: Menu keeps disabled items outside action and dismissal paths', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-menu-trigger').click()
    const delItem = page.getByTestId('menu-item-delete')

    await delItem.click({ force: true })
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: None')

    await delItem.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await expect(page.getByTestId('menu-content')).toBeVisible()
    await expect(page.getByTestId('menu-action-display')).toHaveText('Last Action: None')
    await expect(page.getByTestId('menu-open-logs')).toHaveText('Open Logs: true')
  })
})

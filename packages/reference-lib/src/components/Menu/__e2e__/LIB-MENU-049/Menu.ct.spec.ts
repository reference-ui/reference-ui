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

  test('MN-CLOSE-08: Menu retains open DOM when its parent rejects a Tab-close request', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-controlled-trigger').click()
    await expect(page.getByTestId('menu-controlled-display')).toHaveText('Controlled: Open')

    await page.getByTestId('btn-controlled-reject').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-content-controlled')).toBeVisible()
    await page.getByTestId('controlled-item-1').focus()
    await page.keyboard.press('Tab')

    await expect(page.getByTestId('menu-controlled-logs')).toHaveText(
      'Controlled Logs: request:true,request:false'
    )
    await expect(page.getByTestId('menu-controlled-display')).toHaveText('Controlled: Open')
    await expect(page.getByTestId('menu-content-controlled')).toBeVisible()
  })
})

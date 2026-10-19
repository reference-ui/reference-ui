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

test.describe('Menu LinkItem (FEATURES #3)', () => {

  test('MN-LINK-08: closeOnSelect=false navigates without dismissing', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Links')
    await page.getByTestId('btn-link-trigger').click()

    await page.getByTestId('menu-link-stay').click()
    await expect(page.getByTestId('menu-link-action')).toHaveText('Link Action: Stay')
    expect(await page.evaluate(() => window.location.hash)).toBe('#stay-section')
    await expect(page.getByTestId('menu-link-root')).toBeVisible()
    await expect(page.getByTestId('menu-link-open-logs')).toHaveText('Link Open Logs: true')
  })
})

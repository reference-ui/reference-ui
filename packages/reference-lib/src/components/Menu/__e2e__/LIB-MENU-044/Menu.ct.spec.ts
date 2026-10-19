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

  test('MN-CHOICE-08: Menu applies closeOnSelect defaults and honors explicit overrides', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-close-trigger')
    await trigger.click()
    await page.getByTestId('menu-item-default-close').click()
    await expect(page.getByTestId('menu-close-display')).toHaveText('Close Action: DefaultClose')
    await expect(page.getByTestId('menu-content-close')).toHaveCount(0)

    await trigger.click()
    await page.getByTestId('menu-item-stay-open').click()
    await expect(page.getByTestId('menu-close-display')).toHaveText('Close Action: StayOpen')
    await expect(page.getByTestId('menu-content-close')).toBeVisible()
  })
})

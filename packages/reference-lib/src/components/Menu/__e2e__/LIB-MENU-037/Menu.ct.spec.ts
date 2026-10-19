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

  test('MN-TYPE-01: Menu typeahead searches and wraps within the open level', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-type-trigger').click()
    const apple = page.getByTestId('menu-item-apple')
    const anchor = page.getByTestId('menu-item-anchor')
    const apricot = page.getByTestId('menu-item-apricot')
    const banana = page.getByTestId('menu-item-banana')
    await banana.focus()

    await page.keyboard.press('a')
    await expect(apple).toBeFocused()
    await page.keyboard.press('a')
    await expect(anchor).toBeFocused()
    await page.keyboard.press('a')
    await expect(apricot).toBeFocused()
    await page.keyboard.press('a')
    await expect(apple).toBeFocused()
    await expect(page.getByTestId('menu-item-aubergine')).not.toBeFocused()
  })
})

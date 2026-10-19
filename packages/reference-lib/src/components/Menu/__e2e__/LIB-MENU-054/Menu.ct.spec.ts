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

test.describe('Menu Nested Submenus (FEATURES #1)', () => {

  test('MN-DOM-01: Nested Menu contributes no node between trigger and parent items', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const itemNew = page.getByTestId('menu-sub-item-new')
    const itemHandle = await itemNew.elementHandle()
    if (!itemHandle) throw new Error('expected submenu sibling item handle')
    const sameParent = await trigger.evaluate(
      (el, other) => el.parentElement === (other as HTMLElement).parentElement,
      itemHandle
    )
    expect(sameParent).toBe(true)
  })
})

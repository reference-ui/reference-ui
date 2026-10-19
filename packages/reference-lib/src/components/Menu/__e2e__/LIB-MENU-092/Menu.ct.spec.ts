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
  test('MN-INTENT-02: Diagonal travel toward content keeps the submenu open', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    const trigger = page.getByTestId('menu-sub-trigger')
    const content = page.getByTestId('menu-sub-content')
    await page.getByTestId('menu-sub-item-new').focus()

    await trigger.hover()
    await expect(content).toBeVisible()

    // Diagonal path through the 5px grace polygon into the content. The path
    // ends on a plain item: resting on the nested More trigger would
    // legitimately hover-open the second level mid-travel.
    const from = await centerOf(trigger)
    const to = await centerOf(page.getByTestId('menu-sub-item-email'))
    await page.mouse.move(from.x, from.y)
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(
        from.x + ((to.x - from.x) * step) / 8,
        from.y + ((to.y - from.y) * step) / 8
      )
    }
    await page.waitForTimeout(450)

    await expect(content).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('menu-sub-logs')).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('menu-sub-item-new')).toBeFocused()

    // The content stays reachable: travel ends in a genuine selection.
    await page.getByTestId('menu-sub-item-email').click()
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: Email')
  })
})

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

test.describe('Menu tree dismissal completions', () => {
  test('MN-CLOSE-02: Interaction in portalled descendants stays inside the root subtree', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Submenu')
    await page.getByTestId('btn-sub-trigger').click()
    await expect(page.getByTestId('menu-sub-root')).toBeFocused()
    const trigger = page.getByTestId('menu-sub-trigger')
    await trigger.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    const logs = page.getByTestId('menu-sub-logs')

    // Background chrome: primary + right press select and dismiss nothing.
    await page.getByTestId('menu-sub-pad').click()
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
    await page.getByTestId('menu-sub-pad').click({ button: 'right' })
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()

    // Trigger chrome: right press dismisses nothing.
    await trigger.click({ button: 'right' })
    await expect(logs).toHaveText('Sub Logs: share:onOpen')
    await expect(page.getByTestId('menu-sub-content')).toBeVisible()
    await expect(page.getByTestId('menu-sub-root')).toBeVisible()

    // Only genuine item activation unwinds the tree.
    await page.getByTestId('menu-sub-item-email').click()
    await expect(page.getByTestId('menu-sub-action')).toHaveText('Sub Action: Email')
    await expect(page.getByTestId('menu-sub-root')).toHaveCount(0)
  })
})

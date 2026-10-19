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

test.describe('Menu placement and dynamic ownership', () => {

  test('MN-DYNAMIC-02: Moving an open submenu registers once with its new parent', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/SubmenuProbe')
    await page.getByTestId('btn-probe-dyn-trigger-a').click()
    await expect(page.getByTestId('menu-probe-dyn-root-a')).toBeFocused()
    await page.getByTestId('probe-dyn-trigger').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('probe-dyn-content')).toBeVisible()

    await page.getByTestId('btn-probe-dyn-move').evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('menu-probe-dyn-parent')).toHaveText('Dyn Parent: b')
    await expect(page.getByTestId('probe-dyn-content')).toHaveCount(0)
    await expect(page.getByTestId('menu-probe-dyn-logs')).toHaveText('Dyn Logs: dyn:onOpen')

    // The moved level mounts open under its new parent and closes exactly once.
    await page.getByTestId('btn-probe-dyn-trigger-b').click()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeFocused()
    await expect(page.getByTestId('probe-dyn-content')).toBeVisible()
    await page.getByTestId('probe-dyn-item').focus()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-probe-dyn-logs')).toHaveText(
      'Dyn Logs: dyn:onOpen,dyn:onDismiss'
    )
    await expect(page.getByTestId('probe-dyn-content')).toHaveCount(0)
    await expect(page.getByTestId('probe-dyn-trigger')).toBeFocused()
    await expect(page.getByTestId('menu-probe-dyn-root-b')).toBeVisible()
  })
})

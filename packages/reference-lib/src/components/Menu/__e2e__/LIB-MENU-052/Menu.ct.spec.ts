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

  test('MN-A11Y-01: Menu exposes exact roles, names, states, and one tab stop', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    const trigger = page.getByTestId('btn-menu-trigger')
    await expect(trigger).toHaveAccessibleName('Open Actions')
    await trigger.click()

    const content = page.getByTestId('menu-content')
    await expect(content).toHaveAttribute('role', 'menu')
    await expect(page.getByTestId('menu-item-edit')).toHaveAttribute('role', 'menuitem')
    await expect(page.getByTestId('menu-item-edit')).toHaveAccessibleName('Edit Document')
    await expect(page.getByTestId('menu-item-delete')).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByTestId('menu-separator-1')).toHaveAttribute('role', 'separator')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(content.locator('[tabindex="0"]')).toHaveCount(1)

    // Scanner half: open state first (menu items, separator, disabled
    // item all mounted), then the closed state. Whole-page scope: the
    // menu content portals to document.body, so #root-scoping would miss
    // component-owned content; the gallery holds one story per mount.
    await expectNoAxeViolations(page)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('menu-content')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
    await expectNoAxeViolations(page)
  })
})

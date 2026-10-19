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

  test('MN-DOM-06: Menu represents empty content and separators without roving items', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Parity')
    await page.getByTestId('btn-empty-trigger').click()
    const empty = page.getByTestId('menu-content-empty')
    await expect(empty).toBeVisible()
    await expect(empty).toHaveAttribute('role', 'menu')
    await expect(empty.getByRole('menuitem')).toHaveCount(0)
    await expect(empty.locator('[tabindex="0"]')).toHaveCount(0)
    await page.keyboard.press('Escape')

    await page.getByTestId('btn-menu-trigger').click()
    const sep = page.getByTestId('menu-separator-1')
    await expect(sep).toHaveAttribute('role', 'separator')
    await expect(sep).not.toHaveAttribute('tabindex', '0')
  })
})

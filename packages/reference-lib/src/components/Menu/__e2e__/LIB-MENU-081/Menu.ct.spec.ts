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

test.describe('Menu keyboard, choice items, and adjacent dismiss', () => {

  test('MN-CHOICE-09: Roving and typeahead treat choices as commands, skipping group structure', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    const grid = page.getByTestId('choice-grid')
    const guides = page.getByTestId('choice-guides')
    const mixed = page.getByTestId('choice-mixed')
    const name = page.getByTestId('choice-sort-name')
    const date = page.getByTestId('choice-sort-date')
    const plain = page.getByTestId('choice-plain')
    await expect(root).toBeVisible()

    await grid.focus()
    await page.keyboard.press('ArrowDown')
    await expect(guides).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(mixed).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(name).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(date).toBeFocused()
    // Disabled radio skipped, group never a stop.
    await page.keyboard.press('ArrowDown')
    await expect(plain).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(grid).toBeFocused()

    await expect(root.locator('[tabindex="0"]')).toHaveCount(1)
    await expect(page.getByTestId('choice-sort-group')).not.toHaveAttribute('tabindex', '0')

    // Typeahead crosses item kinds by current text.
    await grid.focus()
    await page.keyboard.press('p')
    await expect(plain).toBeFocused()
    await page.waitForTimeout(1500)
    await page.keyboard.press('n')
    await expect(name).toBeFocused()

    // Movement never requests state.
    await expect(page.getByTestId('menu-choice-change-logs')).toHaveText('Choice Changes: ')
    await expect(root).toBeVisible()
  })
})

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

  test('MN-CHOICE-01: Choice items expose exact roles, checked states, and group naming', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    await expect(root).toBeVisible()

    const grid = page.getByTestId('choice-grid')
    await expect(grid).toHaveAttribute('role', 'menuitemcheckbox')
    await expect(grid).toHaveAttribute('aria-checked', 'false')
    await expect(grid).toHaveAttribute('data-state', 'unchecked')
    expect(await grid.evaluate(el => el.tagName.toLowerCase())).toBe('div')

    const guides = page.getByTestId('choice-guides')
    await expect(guides).toHaveAttribute('aria-checked', 'true')
    await expect(guides).toHaveAttribute('data-state', 'checked')

    const mixed = page.getByTestId('choice-mixed')
    await expect(mixed).toHaveAttribute('aria-checked', 'mixed')
    await expect(mixed).toHaveAttribute('data-state', 'mixed')

    const group = page.getByTestId('choice-sort-group')
    await expect(group).toHaveAttribute('role', 'group')
    await expect(group).toHaveAttribute('aria-label', 'Sort by')

    await expect(page.getByTestId('choice-sort-name')).toHaveAttribute('role', 'menuitemradio')
    await expect(page.getByTestId('choice-sort-name')).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('choice-sort-date')).toHaveAttribute('aria-checked', 'false')
    const size = page.getByTestId('choice-sort-size')
    await expect(size).toHaveAttribute('aria-checked', 'false')
    await expect(size).toHaveAttribute('aria-disabled', 'true')

    // Built-in indicators: checked glyphs render, unchecked slots stay blank.
    await expect(grid.locator('[data-menu-indicator]')).toHaveText('')
    await expect(guides.locator('[data-menu-indicator]')).toHaveText('✓')
    await expect(mixed.locator('[data-menu-indicator]')).toHaveText('–')
    await expect(page.getByTestId('choice-sort-name').locator('[data-menu-indicator]')).toHaveText('●')
  })
})

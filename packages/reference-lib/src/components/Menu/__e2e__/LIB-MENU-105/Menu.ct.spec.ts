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

test.describe('Menu dynamic choice and link parts', () => {
  test('MN-CHOICE-10: Dynamic choice values, handlers, and group membership stay current', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/ChoiceDynamic')
    await page.getByTestId('btn-dyn-choice-trigger').click()
    const root = page.getByTestId('menu-dyn-choice-root')
    const changes = page.getByTestId('menu-dyn-choice-change-logs')
    await expect(root).toBeVisible()

    // Added choice joins roles, ARIA, typeahead, and activation at once.
    await page.getByTestId('btn-dyn-add-check').evaluate(el => (el as HTMLElement).click())
    const gamma = page.getByTestId('dyn-check-gamma')
    await expect(gamma).toHaveAttribute('role', 'menuitemcheckbox')
    await expect(gamma).toHaveAttribute('aria-checked', 'false')
    await page.getByTestId('dyn-check-alpha').focus()
    await page.keyboard.press('g')
    await expect(gamma).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(changes).toContainText('gamma:true')
    await expect(root).toBeVisible()

    // Reorder follows value identity; the checked member stays checked.
    await page.getByTestId('btn-dyn-reverse-radios').evaluate(el => (el as HTMLElement).click())
    const order = await root.locator('[role="menuitemradio"]').evaluateAll(els =>
      els.map(el => el.getAttribute('data-testid'))
    )
    expect(order).toEqual(['dyn-radio-date', 'dyn-radio-name'])
    await expect(page.getByTestId('dyn-radio-name')).toHaveAttribute('aria-checked', 'true')

    // A radio moved between groups answers to its new group authority.
    await page.getByTestId('btn-dyn-move-radio').evaluate(el => (el as HTMLElement).click())
    await expect(
      page.getByTestId('dyn-view-group').getByTestId('dyn-radio-date')
    ).toBeVisible()
    await expect(page.getByTestId('dyn-sort-group').locator('[role="menuitemradio"]')).toHaveCount(
      1
    )
    await page.getByTestId('dyn-radio-name').focus()
    await page.keyboard.press('Enter')
    await expect(changes).toContainText('sort:name')

    // Disabling the focused choice keeps one tab stop and valid menu focus.
    await page.getByTestId('dyn-check-beta').focus()
    await page.getByTestId('btn-dyn-disable-beta').evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('dyn-check-beta')).toHaveAttribute('aria-disabled', 'true')
    await expect(root.locator('[tabindex="0"]')).toHaveCount(1)
    expect(
      await root.evaluate(
        el => el.contains(document.activeElement) && document.activeElement !== document.body
      )
    ).toBe(true)

    // Removed choices leave no stale registrations behind.
    await page.getByTestId('btn-dyn-remove-check').evaluate(el => (el as HTMLElement).click())
    await expect(page.getByTestId('dyn-check-alpha')).toHaveCount(0)
    await page.waitForTimeout(1200)
    await page.getByTestId('dyn-check-gamma').focus()
    await page.keyboard.press('a')
    await expect(page.getByTestId('dyn-check-gamma')).toBeFocused()
    await expect(changes).not.toContainText('alpha:')
  })
})

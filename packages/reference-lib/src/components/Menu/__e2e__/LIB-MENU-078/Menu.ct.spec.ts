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

  test('MN-CHOICE-04: RadioItem requests its value once while the group stays controlled', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    const changes = page.getByTestId('menu-choice-change-logs')
    const selects = page.getByTestId('menu-choice-select-logs')
    const name = page.getByTestId('choice-sort-name')
    const date = page.getByTestId('choice-sort-date')
    await expect(root).toBeVisible()

    await date.click()
    await expect(changes).toHaveText('Choice Changes: sort:date')
    await expect(selects).toHaveText('Choice Selects: sort-date:click:1')
    await expect(root).toBeVisible()
    await expect(date).toHaveAttribute('aria-checked', 'true')
    await expect(name).toHaveAttribute('aria-checked', 'false')

    // Activating the already-selected value still requests it once.
    await date.click()
    await expect(changes).toHaveText('Choice Changes: sort:date,sort:date')

    await name.focus()
    await page.keyboard.press('Enter')
    await expect(changes).toHaveText('Choice Changes: sort:date,sort:date,sort:name')
    await expect(selects).toContainText('sort-name:keydown:Enter')
    await expect(name).toHaveAttribute('aria-checked', 'true')

    // Disabled radio is inert on every route.
    await page.getByTestId('choice-sort-size').click({ force: true })
    await expect(changes).toHaveText('Choice Changes: sort:date,sort:date,sort:name')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('menu-choice-open-logs')).toHaveText('Choice Open Logs: true')
  })
})

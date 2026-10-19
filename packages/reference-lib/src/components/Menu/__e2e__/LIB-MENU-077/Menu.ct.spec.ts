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

  test('MN-CHOICE-02: CheckboxItem requests the opposite boolean once per modality and stays open', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    const changes = page.getByTestId('menu-choice-change-logs')
    const selects = page.getByTestId('menu-choice-select-logs')
    await expect(root).toBeVisible()

    await page.getByTestId('choice-grid').click()
    await expect(changes).toHaveText('Choice Changes: grid:true')
    await expect(selects).toHaveText('Choice Selects: grid:click:1')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('choice-grid')).toHaveAttribute('aria-checked', 'true')

    await page.getByTestId('choice-guides').click()
    await expect(changes).toHaveText('Choice Changes: grid:true,guides:false')
    await expect(root).toBeVisible()
    await expect(page.getByTestId('choice-guides')).toHaveAttribute('aria-checked', 'false')

    // Mixed requests true; the log-only parent rejects, so ARIA never moves.
    await page.getByTestId('choice-mixed').focus()
    await page.keyboard.press('Enter')
    await expect(changes).toHaveText('Choice Changes: grid:true,guides:false,mixed:true')
    await expect(selects).toContainText('mixed:keydown:Enter')
    await expect(page.getByTestId('choice-mixed')).toHaveAttribute('aria-checked', 'mixed')
    await expect(root).toBeVisible()

    // Space toggles too, exactly once.
    await page.getByTestId('choice-grid').focus()
    await page.keyboard.press('Space')
    await expect(changes).toHaveText('Choice Changes: grid:true,guides:false,mixed:true,grid:false')
    await expect(root).toBeVisible()

    await expect(page.getByTestId('menu-choice-open-logs')).toHaveText('Choice Open Logs: true')
    await expect(page.getByTestId('menu-choice-state')).toHaveText(
      'Choice State: grid=false,guides=false,sort=name'
    )
  })
})

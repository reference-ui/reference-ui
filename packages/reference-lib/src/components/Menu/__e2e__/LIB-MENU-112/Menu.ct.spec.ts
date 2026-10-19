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

test.describe('Menu composition gates', () => {

  test('MN-COMP-04: Settings menu composes controlled choices with per-item close policy', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-trigger').click()
    const root = page.getByTestId('menu-choice-root')
    await expect(root).toBeVisible()

    // Pointer choice requests state and stays open by default.
    await page.getByTestId('choice-grid').click()
    await expect(page.getByTestId('menu-choice-change-logs')).toHaveText(
      'Choice Changes: grid:true'
    )
    await expect(root).toBeVisible()
    await expect(page.getByTestId('menu-choice-state')).toContainText('grid=true')

    // Keyboard radio requests its value with shared roving order.
    await page.getByTestId('choice-sort-date').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('menu-choice-change-logs')).toHaveText(
      'Choice Changes: grid:true,sort:date'
    )
    await expect(root).toBeVisible()

    // Typeahead crosses into choices; rejection stays authoritative.
    await page.getByTestId('choice-plain').focus()
    await page.keyboard.press('m')
    await expect(page.getByTestId('choice-mixed')).toBeFocused()
    await page.getByTestId('choice-mixed').click()
    await expect(page.getByTestId('choice-mixed')).toHaveAttribute('aria-checked', 'mixed')

    // Explicit close policy dismisses after the state request.
    await page.keyboard.press('Escape')
    await page.getByTestId('btn-choice-close-trigger').click()
    await page.getByTestId('choice-close-check').click()
    await expect(page.getByTestId('menu-choice-close-logs')).toHaveText(
      'Choice Close Logs: true,false'
    )
    await expect(page.getByTestId('menu-choice-close-root')).toHaveCount(0)
  })
})

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

  test('MN-CHOICE-08: Choices default to staying open and honor explicit closeOnSelect', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    // Default: activation without dismissal (also asserted in 02/04).
    await page.getByTestId('btn-choice-trigger').click()
    await page.getByTestId('choice-grid').click()
    await expect(page.getByTestId('menu-choice-root')).toBeVisible()
    await expect(page.getByTestId('menu-choice-open-logs')).toHaveText('Choice Open Logs: true')
    await page.keyboard.press('Escape')

    // Explicit true: state request first, then one complete dismissal.
    await page.getByTestId('btn-choice-close-trigger').click()
    const closeRoot = page.getByTestId('menu-choice-close-root')
    await expect(closeRoot).toBeVisible()
    await page.getByTestId('choice-close-check').click()
    await expect(closeRoot).toHaveCount(0)
    await expect(page.getByTestId('menu-choice-close-logs')).toHaveText('Choice Close Logs: true,false')
    await expect(page.getByTestId('menu-choice-change-logs')).toHaveText(
      'Choice Changes: grid:true,close-check:true'
    )
    await expect(page.getByTestId('btn-choice-close-trigger')).toBeFocused()

    await page.getByTestId('btn-choice-close-trigger').click()
    await page.getByTestId('choice-close-radio').click()
    await expect(page.getByTestId('menu-choice-close-root')).toHaveCount(0)
  })
})

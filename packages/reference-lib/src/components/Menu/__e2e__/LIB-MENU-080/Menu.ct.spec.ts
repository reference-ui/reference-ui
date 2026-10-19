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

  test('MN-CHOICE-07: Choice cancellation stops both the state request and dismissal', async ({
    mount,
    page,
  }) => {
    await mount('components/Menu/Menu/Choice')
    await page.getByTestId('btn-choice-cancel-trigger').click()
    const root = page.getByTestId('menu-choice-cancel-root')
    const display = page.getByTestId('menu-choice-cancel-display')
    await expect(root).toBeVisible()

    await page.getByTestId('choice-cancel-native').click()
    await expect(display).toHaveText('Choice Cancel: None')
    await expect(root).toBeVisible()

    await page.getByTestId('choice-cancel-select').click()
    // onSelect ran (and prevented); onChange never fired.
    await expect(display).toHaveText('Choice Cancel: SelectCancel')
    await expect(root).toBeVisible()

    await page.getByTestId('choice-cancel-select').focus()
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Choice Cancel: SelectCancel')
    await expect(root).toBeVisible()
  })
})

/**
 * Calendar browser proofs: grid rendering, selection, navigation,
 * locale presentation, keyboard moves, and constrained states. Mounts
 * the story machines and asserts one-request-per-gesture discipline
 * with stable tab stops in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

// Landing-sequence engine scope: Safari/WebKit never delivers
// click-focus to buttons/links (mousedown blurs to body) and its native Tab
// order skips them, honoring text controls + explicit tabindex stops only.
// `engineOf` sniffs the Playwright project (`react19` on agentct Chromium,
// `react19-firefox`/`react19-webkit` on the sweep vehicle) so specs can
// compensate delivery or assert the deterministic platform outcome.
function engineOf(): 'chromium' | 'firefox' | 'webkit' {
  const project = test.info().project.name
  if (project.includes('webkit')) return 'webkit'
  if (project.includes('firefox')) return 'firefox'
  return 'chromium'
}

test.describe('Calendar CT', () => {
  test('CA-KEY-10: a pending focus target dies when constraints stale it', async ({
    mount,
    page,
  }) => {
    await mount('components/Calendar/Calendar/OutsideMonth')

    await page.locator('button[data-date="2024-09-30"]').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('out-month-reqs')).toHaveText('2024-10')

    // Binding maxes the grid at 2024-09-20 before the month is accepted.
    await page.getByTestId('out-toggle-bounds').click()
    await page.getByTestId('out-accept').click()
    await expect(page.getByTestId('out-heading')).toContainText('October 2024')

    // October 1 is disabled: no late focus, no tab stop anywhere.
    await expect(page.locator('button[data-date="2024-10-01"]')).not.toBeFocused()
    await expect(page.locator('button[data-date][tabindex="0"]')).toHaveCount(0)
    await expect(page.getByTestId('out-changes')).toHaveText('none')
  })
});
